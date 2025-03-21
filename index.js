const express = require('express')
const app = express()
const OpenAI = require('openai')
const { createClient } = require('@supabase/supabase-js')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf')
require('dotenv').config()

app.use(express.json())

const openai = new OpenAI({ baseURL: 'http://127.0.0.1:1234/v1', apiKey: 'lm-studio' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

app.post('/embed', async (req, res) => {
  try {
    await generateAndStoreEmbeddings(req.body.file)
    res.status(200).json({ message: 'Successfully Embedded' })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Error occurred',
    })
  }
})

app.post('/query', async (req, res) => {
  try {
    const { query } = req.body
    const result = await handleQuery(query)
    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Error occurred',
    })
  }
})

async function generateAndStoreEmbeddings(fileName) {
  const VALID_FILE_NAMES = ['C2024A00027REC01.pdf', 'C2024A00127.pdf']

  if (!VALID_FILE_NAMES.includes(fileName)) {
    throw new Error('Invalid file name')
  }

  const loader = new PDFLoader(`source-docs/${fileName}`, {
    splitPages: false,
    parsedItemSeparator: '',
  })
  const docs = await loader.load()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  const chunks = await textSplitter.splitDocuments(docs)

  const promises = chunks.map(async (chunk) => {
    const cleanChunk = chunk.pageContent.replace(/\n/g, ' ')

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-nomic-embed-text-v1.5',
      input: cleanChunk,
    })

    const [{ embedding }] = embeddingResponse.data

    const { error } = await supabase.from('documents').insert({
      content: cleanChunk,
      embedding,
    })

    if (error) {
      throw error
    }
  })

  await Promise.all(promises)
}

async function handleQuery(query) {
  const input = query.replace(/\n/g, ' ')

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-nomic-embed-text-v1.5',
    input,
  })

  const [{ embedding }] = embeddingResponse.data

  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
  })

  if (error) throw error

  let contextText = ''

  contextText += documents.map((document) => `${document.content.trim()}---\n`).join('')

  const messages = [
    {
      role: 'system',
      content: `You are an AI assistant specializing in automated compliance solutions for Work, Health & Safety (WHS) laws. You help users understand regulatory requirements, identify compliance gaps, and suggest practical implementation strategies. Use the provided context to offer specific, actionable guidance on WHS compliance. Always provide accurate information with references to relevant regulations when possible.`,
    },
    {
      role: 'user',
      content: `Context sections: "${contextText}" Question: "${query}" Answer as simple text:`,
    },
  ]

  const completion = await openai.chat.completions.create({
    messages,
    model: 'gemma-3-4b-it',
    temperature: 0.8,
  })

  return completion.choices[0].message.content
}

app.listen('3035', () => {
  console.log('App is running on port 3035')
})
