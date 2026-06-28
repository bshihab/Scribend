"""
medical_vocabulary.py
=====================
A curated list of medical terms given to the Whisper model as an
'initial_prompt'. This biases the speech-recognition model toward
recognizing these terms correctly, dramatically reducing phonetic
mishearing of complex medical vocabulary.
"""

MEDICAL_VOCABULARY_PROMPT = (
    # Cardiac & Vascular
    "tachycardia, bradycardia, arrhythmia, palpitations, hypertension, hypotension, "
    "syncope, orthostatic, dyspnea, edema, angina, myocardial infarction, "
    # Respiratory
    "pneumonia, bronchitis, asthma, COPD, wheezing, dyspnea, pleurisy, hemoptysis, "
    "pneumothorax, atelectasis, tachypnea, crackles, rhonchi, "
    # Neurological
    "migraine, vertigo, neuropathy, seizure, syncope, paresthesia, dysarthria, "
    "aphasia, ataxia, tremor, encephalopathy, "
    # GI
    "dysphagia, nausea, vomiting, diarrhea, constipation, hematochezia, melena, "
    "hepatomegaly, splenomegaly, cholecystitis, pancreatitis, "
    # Musculoskeletal
    "arthralgia, myalgia, tendinitis, bursitis, osteoporosis, fracture, "
    # Medications & Dosages
    "milligrams, micrograms, Metformin, Lisinopril, Atorvastatin, Amlodipine, "
    "Ibuprofen, Acetaminophen, Amoxicillin, Azithromycin, Prednisone, Metoprolol, "
    # General Clinical
    "SOAP note, chief complaint, history of present illness, past medical history, "
    "review of systems, physical examination, assessment, plan, follow-up, "
    "diagnosis, differential diagnosis, prognosis, contraindication, "
    "blood pressure, heart rate, respiratory rate, oxygen saturation, temperature"
)
