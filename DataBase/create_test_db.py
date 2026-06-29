import sqlite3
import os

db_path = r"E:\Projects\2026\CaseDiaryNew\DataBase\test_backup_unencrypted.db"

# Remove existing test db if any
if os.path.exists(db_path):
    os.remove(db_path)

def create_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create Cases table
    cursor.execute("""
    CREATE TABLE Cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uniqueId TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        CaseTitle TEXT,
        ClientName TEXT,
        OnBehalfOf TEXT,
        CNRNumber TEXT,
        case_number TEXT,
        case_year INTEGER,
        court_name TEXT,
        case_type_name TEXT,
        dateFiled TEXT,
        NextDate TEXT,
        PreviousDate TEXT,
        StatuteOfLimitations TEXT,
        crime_number TEXT,
        crime_year INTEGER,
        police_station_id INTEGER,
        Undersection TEXT,
        FirstParty TEXT,
        OppositeParty TEXT,
        Accussed TEXT,
        ClientContactNumber TEXT,
        JudgeName TEXT,
        OpposingCounsel TEXT,
        CaseStatus TEXT,
        Priority TEXT,
        CaseDescription TEXT,
        CaseNotes TEXT,
        created_at TEXT,
        updated_at TEXT
    );
    """)
    
    # Create CaseTimeline table
    cursor.execute("""
    CREATE TABLE CaseTimeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        notes TEXT,
        hearing_date TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (case_id) REFERENCES Cases(id) ON DELETE CASCADE
    );
    """)

    # Create PoliceStations table
    cursor.execute("""
    CREATE TABLE PoliceStations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        district_id INTEGER,
        user_id INTEGER
    );
    """)
    
    # Insert test data
    cursor.execute("""
    INSERT INTO Cases (uniqueId, CaseTitle, ClientName, CNRNumber, case_number, court_name, NextDate, CaseStatus, Priority)
    VALUES 
    ('test_case_1', 'State vs. Rajesh Kumar', 'Rajesh Kumar', 'DNDL010023452026', 'FIR 104/2026', 'District Court Dwarka', '2026-07-15', 'Open', 'High'),
    ('test_case_2', 'Amit Sharma vs. Sneha Sharma', 'Amit Sharma', 'MHMC010045672025', 'H.M.P 245/2025', 'Family Court Bandra', '2026-08-20', 'Open', 'Medium'),
    ('test_case_3', 'Tech Solutions Ltd. Recovery', 'Tech Solutions Ltd.', '', 'O.S. 8892/2024', 'Commercial Court Bengaluru', '2026-06-30', 'Open', 'Low');
    """)
    
    # Insert timeline hearings
    cursor.execute("""
    INSERT INTO CaseTimeline (case_id, notes, hearing_date)
    VALUES 
    (1, 'Arguments on charge and bail application.', '2026-07-15'),
    (2, 'Mediation hearing and cross-examination.', '2026-08-20'),
    (3, 'Ex-parte evidence submission.', '2026-06-30');
    """)
    
    conn.commit()
    conn.close()
    print("test_backup_unencrypted.db created successfully.")

if __name__ == "__main__":
    create_db()
