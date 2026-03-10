from flask import Flask, render_template, request, jsonify, send_file
import joblib
import traceback
import pandas as pd
import zipfile
import os

# Initialize Flask App
app = Flask(__name__)

complaint_history = []

# Load Trained Models
try:
    vectorizer = joblib.load("saved_models/vectorizer.pkl")
    category_model = joblib.load("saved_models/complaint_model.pkl")
    priority_model = joblib.load("saved_models/priority_model.pkl")
    le_category = joblib.load("saved_models/le_category.pkl")
    le_priority = joblib.load("saved_models/le_priority.pkl")
    le_location = joblib.load("saved_models/le_location.pkl")

    print("Models Loaded Successfully")

except Exception as e:
    print("Error loading models:", e)


# Department Mapping
def get_department(category):

    mapping = {
        "Garbage": "Sanitation Department",
        "Water Issue": "Water Supply Department",
        "Electricity": "Electricity Department",
        "Drainage": "Drainage Department",
        "Road Damage": "Road Maintenance Department"
    }

    return mapping.get(category, "General Municipal Department")


# Severity Score Calculation
def calculate_severity(priority, days):

    score = 0

    if priority == "High":
        score += 7
    elif priority == "Medium":
        score += 4
    else:
        score += 2

    score += min(days / 2, 3)

    return round(score, 2)

# Emergency Keyword Detection
def check_emergency_keywords(text):

    emergency_keywords = [
        "fire",
        "burst",
        "accident",
        "electric",
        "live wire",
        "gas leak",
        "flood",
        "sewage",
        "spark"
    ]

    text_lower = text.lower()

    for word in emergency_keywords:
        if word in text_lower:
            return True

    return False

def adjust_category_with_keywords(text, predicted_category):

    text_lower = text.lower()

    electricity_keywords = [
        "electric", "wire", "spark", "power", "current", "shock", "transformer"
    ]

    water_keywords = [
        "water", "pipe", "leak", "tap", "supply"
    ]

    drainage_keywords = [
        "drain", "sewage", "drainage", "overflow"
    ]

    garbage_keywords = [
        "garbage", "trash", "waste", "dustbin"
    ]

    road_keywords = [
        "road", "pothole", "street", "crack"
    ]

    if any(word in text_lower for word in electricity_keywords):
        return "Electricity"

    if any(word in text_lower for word in water_keywords):
        return "Water Issue"

    if any(word in text_lower for word in drainage_keywords):
        return "Drainage"

    if any(word in text_lower for word in garbage_keywords):
        return "Garbage"

    if any(word in text_lower for word in road_keywords):
        return "Road Damage"

    return predicted_category


# Home Route
@app.route("/")
def home():
    return render_template("index.html")


# Prediction Route
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data received"}), 400

        complaint_text = data.get("text")
        location_type = data.get("location_type").strip()
        days_pending = data.get("days_pending")

        # ---------------- Validation ----------------
        if not complaint_text:
            return jsonify({"error": "Complaint text missing"}), 400

        if not location_type:
            return jsonify({"error": "Location type missing"}), 400

        if days_pending is None:
            return jsonify({"error": "Days pending missing"}), 400

        # CATEGORY PREDICTION
        vect_text = vectorizer.transform([complaint_text])
        category_pred = category_model.predict(vect_text)[0]
        category_pred = adjust_category_with_keywords(complaint_text, category_pred)

        location_encoded = le_location.transform([location_type])[0]
        category_encoded = le_category.transform([category_pred])[0]

        priority_input = [[category_encoded, int(days_pending), location_encoded]]
        priority_encoded = priority_model.predict(priority_input)[0]
        priority_pred = le_priority.inverse_transform([priority_encoded])[0]

        if check_emergency_keywords(complaint_text):
            priority_pred = "High"

        department = get_department(category_pred)
        severity_score = calculate_severity(priority_pred, int(days_pending))

        complaint_history.append({
            "category": category_pred,
            "priority": priority_pred,
            "location": location_type,
            "days_pending": int(days_pending),
            "severity": severity_score,
            "department": department
        })

        # Return Response
        return jsonify({
            "category": category_pred,
            "priority": priority_pred,
            "severity": severity_score,
            "department": department
        })

    except Exception as e:
        print("\nFULL ERROR TRACE:")
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500


# Stats Route
@app.route("/stats")
def stats():

    if len(complaint_history) == 0:
        return jsonify({})

    total = len(complaint_history)

    category_count = {}
    priority_count = {}
    avg_days = 0
    avg_severity = 0

    for c in complaint_history:
        category_count[c["category"]] = category_count.get(c["category"], 0) + 1
        priority_count[c["priority"]] = priority_count.get(c["priority"], 0) + 1
        avg_days += c["days_pending"]
        avg_severity += c["severity"]

    avg_days = avg_days / total
    avg_severity = avg_severity / total

    return jsonify({
        "total_complaints": total,
        "category_distribution": category_count,
        "priority_distribution": priority_count,
        "average_days_pending": round(avg_days, 2),
        "average_severity": round(avg_severity, 2)
    })


# Download Report Route
@app.route("/download_report")
def download_report():

    if not complaint_history:
        return "No data available"

    df = pd.DataFrame(complaint_history)

    zip_filename = "department_reports.zip"

    with zipfile.ZipFile(zip_filename, 'w') as zipf:

        categories = df["category"].unique()

        for category in categories:

            category_df = df[df["category"] == category]

            file_name = category.replace(" ", "_") + "_report.csv"

            category_df.to_csv(file_name, index=False)

            zipf.write(file_name)

            os.remove(file_name)

    return send_file(zip_filename, as_attachment=True)


# Run App
if __name__ == "__main__":
    app.run(debug=True)