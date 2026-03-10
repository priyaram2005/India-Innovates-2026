# AI-Powered Civic Complaint Management System

## Project Overview
This project is an AI-powered system designed to help municipal authorities efficiently manage and analyze civic complaints. The system automatically classifies complaints, predicts their priority, assigns them to the appropriate department, and generates reports for better decision-making.

## Problem Statement
Municipal corporations receive a large number of complaints related to infrastructure issues such as water leaks, road damage, electricity problems, drainage overflow, and garbage management. Handling these complaints manually can be time-consuming and inefficient. It becomes difficult to identify urgent issues quickly and route them to the correct department.

## Solution
This system uses **machine learning and natural language processing (NLP)** to automatically analyze complaint text and perform the following tasks:
- Classify complaints into categories
- Predict complaint priority
- Detect emergency situations using keywords
- Assign the complaint to the appropriate municipal department
- Calculate a severity score
- Generate department-wise reports for analysis

This helps authorities respond faster and manage complaints more efficiently.

## Features
- AI-based complaint classification
- Intelligent priority prediction
- Emergency keyword detection
- Automatic department assignment
- Severity score calculation
- Department-wise report generation
- Analytics and statistics dashboard

## Tech Stack
- Python
- Flask
- Scikit-learn
- TF-IDF Vectorizer
- Pandas
- Joblib
- HTML / CSS / JavaScript

## Machine Learning Algorithms
- Logistic Regression (Complaint Classification)
- Logistic Regression (Priority Prediction)

## Project Structure
project/
│
├── app.py
├── bg.jpg
├── civic_complaints.csv
├── generate_dataset.ipynb
├── train_model.ipynb
|
├── saved_models/
│ ├── vectorizer.pkl
│ ├── complaint_model.pkl
│ ├── priority_model.pkl
│ ├── le_category.pkl
│ ├── le_priority.pkl
│ └── le_location.pkl
|
├── static
│ ├── style.css
│ └── script.js
|
├── templates/
│ └── index.html
│
├── requirements.txt
└── README.md


## How to Run the Project

### 1. Clone the repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

### 2. Install dependencies
pip install -r requirements.txt

### 3. Run the Flask application
python app.py

### 4. Open in Browser
http://127.0.0.1:5000/


## Future Improvements
- Citizen mobile app integration
- Real-time complaint tracking
- Multilingual complaint support
- Integration with real government complaint portals

## Authors
- Priya Ram
- Tanushree Behera
- Saloni kalokhe
