# MINAL by IMINXL - Future Processing Guide

This app is a React + TypeScript fitness chatbot/dashboard trained from local gym and workout CSV datasets.

## Identity

- Brand: MINAL by IMINXL
- Role: Gym and Fitness App Consultant
- Instagram: https://instagram.com/iminxl

## Main Commands

```bash
npm.cmd install
npm.cmd run train:data
npm.cmd run build
npm.cmd run dev
```

Use `train:data` again whenever `gym_reviews_dataset.csv` or `workout_dataset.csv` changes.

## Important Files

- `src/App.tsx` - website UI, navigation, chatbot interface, project/viva section.
- `src/styles.css` - visual design and responsive layout.
- `src/lib/flexyCoach.ts` - chatbot logic, project viva answers, fitness planner, exportable project brief.
- `src/lib/trainedKnowledge.ts` - generated training knowledge from the CSV datasets.
- `scripts/build-knowledge.mjs` - training script that reads CSV files and generates `trainedKnowledge.ts`.

## Teacher/Viva Questions To Practice

- Explain this project.
- What is the objective?
- What datasets did you use?
- How did you collect the data?
- What preprocessing steps are used?
- What is Bag of Words?
- What is TF-IDF?
- Why are BERT/RoBERTa/DistilBERT relevant?
- How does sentiment analysis work here?
- How does the chatbot answer questions?
- What are the limitations?
- What is the future scope?
- What is the business use case?
- What are ethical concerns in scraping and fitness advice?

## Future Upgrade Path

1. Add a backend API with Node/Express, Flask, or FastAPI.
2. Store users, chats, and workout logs in a database.
3. Connect the Start button to Instagram, WhatsApp, or a booking form.
4. Add authentication for trainers/clients.
5. Fine-tune a transformer model for sentiment or question-answering.
6. Add vector search with embeddings for more accurate dataset retrieval.
7. Deploy frontend to Vercel/Netlify and backend to Render/Railway.
8. Add admin upload for new CSV files and retrain from the browser.

## Presentation Tip

Open the website, go to `Project`, download the project brief, then use the chatbot quick prompts to practice viva answers live.
