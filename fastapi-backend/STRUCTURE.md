fastapi-backend/
│── app/
│   │── main.py
│   │── dependencies.py
│   ├── api/
│   │   ├── upload.py
│   │   ├── summary.py
│   │   ├── qa.py
│   │   ├── quiz.py
│   │   ├── voice.py
│   │   └── memory.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   │
│   ├── schemas/
│   │   ├── summary.py
│   │   ├── quiz.py
│   │   ├── qa.py
│   │   └── voice.py
│   │
│   ├── rag/
│   │   ├── chunker.py
│   │   ├── embedder.py
│   │   ├── vectordb.py
│   │   └── retriever.py
│   │
│   ├── agents/
│   │   ├── summary_agent.py
│   │   ├── qa_agent.py
│   │   └── quiz_agent.py
│   │
│   ├── voice/
│   │   ├── stt.py
│   │   └── tts.py
│   │
│   ├── mcp/
│   │   ├── server.py
│   │   └── tools/
│   │       ├── document_tools.py
│   │       ├── summary_tools.py
│   │       ├── quiz_tools.py
│   │       └── qa_tools.py
│   │   
│   ├── utils/
│   │   ├── pdf.py
│   │   └── docx.py
│   └── services/
│      ├── upload_service.py
│      ├── summary_service.py
│      ├── qa_service.py
│      └── quiz_service.py
│   
│   
│
├──  tests/
├── requirements.txt
├── .env
├── README.md
└── STRUCTURE.md
