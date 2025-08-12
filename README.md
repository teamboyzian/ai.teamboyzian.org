# InfoSeeker - Team Boyzian

## Overview
InfoSeeker is an AI-powered question answering web app that provides verified information in both Bangla and English.  
It uses OpenAI's GPT model via a serverless API hosted on Vercel.

## Features
- Ask questions in Bangla or English
- Get concise, fact-based answers
- Animated background UI with glassmorphic design
- Rate-limited backend API for protection

## Project Structure

project-root/ api/ ask.js         # Serverless API function public/ index.html     # Frontend UI README.md        # Project documentation

## Setup & Deployment

1. Clone this repository:
```bash
git clone https://github.com/teamboyzian/ai.teamboyzian.org.git

2. Set up environment variables:



On your local machine, create a .env file or

In Vercel dashboard, add environment variable:

OPENAI_API_KEY with your OpenAI API key



3. Deploy on Vercel:



Import the repo to Vercel

Add the environment variable in Vercel settings

Deploy and visit the live URL


Usage

Open the deployed app URL

Type your question (in Bangla or English)

Click “Ask InfoSeeker” to get an answer


Notes

The app relies on OpenAI API, so an API key is required.

Please be aware AI-generated answers may sometimes contain errors.


License

MIT License
