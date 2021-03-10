const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

// All Books route
router.get('/', async (req, res) => {
  let query = Book.find();

  if (req.query.title && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'));
  }

  if (req.query.publishedBefore && req.query.publishedBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore)
  }

  if (req.query.publishedAfter && req.query.publishedAfter != '') {
    query = query.gte('publishDate', req.query.publishedAfter)
  }
  
  try {
    const books = await query.exec();
    res.render('books/index', {
      books: books,
      searchOptions: req.query,
  });
  } catch {
    res.redirect('/');
  }
});

// New Book route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Book());
})

// Create Book route
router.post('/', async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });

  saveCover(book, req.body.cover)

  try {
    const newBook = await book.save();
    // res.redirect(`books/${newBook.id}`);
    res.redirect('books');
  } catch {
    console.log(err);
    renderNewPage(res, book, true);
  }
})


async function renderNewPage (res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    }
    if (hasError) params.errorMessage = 'Error Creating Book';
    res.render('books/new', params)
  } catch(err) {
    console.log(err);
    res.redirect('books');
  }
}

function saveCover (book, coverEncoded) {
  if (!coverEncoded) return;
  const cover = JSON.parse(coverEncoded);
  if (cover && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, 'base64');
    book.coverImageType = cover.type;
  }
}

module.exports = router;
