# RAG Application with Node.js & LangChain

## Architecture

![Architecture](/assets/rag-architecture.png)

## How to run?

### Requirements

- Node.js - Express Framework
- Package Manager: npm
- OpenAI API Key: [LM Studio](https://lmstudio.ai/)
  - Embedding models: text-embedding-nomic-embed-text-v1.5
  - Text generation models: gemma-3-4b-it
- Vector Database: [supabase](https://supabase.com/) - [pgvector](https://github.com/pgvector/pgvector)

### Run locally

1. Clone the repository
   ```
    git clone
    cd
   ```
2. Run `run.sql` file to migrate database
3. Run LLM Studio
   ![LM Studio](/assets/lmstudio.png)
4. Set Up Environment Variables
   ```
    SUPABASE_URL=
    SUPABASE_ANON_KEY=
   ```
5. Run application
   ```bash
   node index.js
   ```

### API Docs

- /embed

  - body:

  ```
    {
        "file": "C2024A00027REC01.pdf"
    }
  ```

- /query
  - body:
  ```
   {
       "query": "give me info about Social media minimum age"
   }
  ```

### Result

- Embedding
  ![Embedding](/assets/embed-vector.png)

### References

- [Implement RAG using Node.js, PGVector, Langchain and GPT 4](https://github.com/TheFisola/rag-poc)
