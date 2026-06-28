import json
from sentence_transformers import SentenceTransformer

def main():
    print("Loading MiniLM...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    notes = [
        "Patient has a history of severe asthma, exacerbated by cold weather.",
        "Prescribed Albuterol inhaler 90mcg, 2 puffs every 4-6 hours as needed for wheezing.",
        "Patient was diagnosed with Type 2 Diabetes Mellitus in 2015.",
        "Currently taking Metformin 1000mg twice daily with meals.",
        "Most recent HbA1c was 7.2%, indicating moderate glycemic control.",
        "Patient complains of chronic lower back pain, radiating to the left sciatica.",
        "MRI of the lumbar spine revealed a herniated disc at L4-L5.",
        "Patient reports frequent episodes of acid reflux, especially after spicy foods.",
        "Prescribed Omeprazole 20mg once daily before breakfast for GERD.",
        "Patient has a history of generalized anxiety disorder, diagnosed in early adulthood.",
        "Currently managed with Sertraline 50mg daily and weekly cognitive behavioral therapy.",
        "Blood pressure has been consistently elevated, averaging 145/90 mmHg over the last three visits.",
        "Started on Lisinopril 10mg daily to manage primary hypertension.",
        "Patient underwent an appendectomy in 2012 without complications.",
        "Reports mild osteoarthritis in both knees, worsening after long walks.",
        "Advised to take Ibuprofen 400mg as needed for knee joint pain.",
        "Patient is allergic to Penicillin, resulting in severe hives and facial swelling.",
        "Lipid panel shows hyperlipidemia with LDL cholesterol at 165 mg/dL.",
        "Started on Atorvastatin 20mg nightly to reduce cardiovascular risk.",
        "Patient complains of persistent dry cough for the past 3 weeks, non-productive."
    ]

    queries = [
        {"query": "Patient is short of breath and wheezing", "expected": "Patient has a history of severe asthma, exacerbated by cold weather."},
        {"query": "Blood sugar is too high", "expected": "Most recent HbA1c was 7.2%, indicating moderate glycemic control."},
        {"query": "Nerve pain in the leg", "expected": "Patient complains of chronic lower back pain, radiating to the left sciatica."},
        {"query": "Heartburn after eating", "expected": "Patient reports frequent episodes of acid reflux, especially after spicy foods."},
        {"query": "Allergic to antibiotics", "expected": "Patient is allergic to Penicillin, resulting in severe hives and facial swelling."}
    ]

    print("Embedding notes...")
    note_embeddings = model.encode(notes, normalize_embeddings=True)
    
    print("Embedding queries...")
    query_texts = [q["query"] for q in queries]
    query_embeddings = model.encode(query_texts, normalize_embeddings=True)

    output_data = {
        "notes": [{"text": text, "embedding": emb.tolist()} for text, emb in zip(notes, note_embeddings)],
        "queries": [{"text": q["query"], "expected_match": q["expected"], "embedding": emb.tolist()} for q, emb in zip(queries, query_embeddings)]
    }

    with open("dev3_final_test.json", "w") as f:
        json.dump(output_data, f, indent=2)

    print("✅ Saved dev3_final_test.json")

if __name__ == "__main__":
    main()
