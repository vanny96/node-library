var BookInstance = require('../model/bookInstance');
var Book = require('../model/book');

var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
                .populate('book')
                .exec(function(err, data){
                    if (err) return next(err);
                    res.render('bookinstanceslist', {title: 'Book Instances List', bookinstances: data});
                })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, result){
        if(err) {return next(err)}
        if(result == null){
            var err = new Error('BookInstance not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstancedetails', {title: 'Copy: '+result.book.title, bookinstance: result})
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstanceform', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { 
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstanceform', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
                .populate('book')
                .exec(function(err, result){
                    if(err) {return next(err)};
                    res.render('bookinstancedelete', {title: 'Delete Book Instance', bookinstance: result})
                })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.params.id, function(err, result){
        if(err) {return next(err)};

        res.redirect('/catalog/bookinstances')
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback){
            BookInstance.findById(req.params.id)
            .exec(callback)
        },
        books: function(callback){
            Book.find({}, 'title')
            .exec(callback);
        }
    }, function(err, results){
        if(err) { return next(err)};

        res.render('bookinstanceform', {title: 'Update BookInstance', book_list: results.books, bookinstance: results.bookinstance});
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [ 
    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    function(req, res, next) {
        const errors = validationResult(req);

        var bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        })

        if(!errors.isEmpty()){
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstanceform', { title: 'Create BookInstance', book_list: books, selected_book: bookInstance.book._id , errors: errors.array(), bookinstance: bookInstance });
            });
            return;
        } else {

            BookInstance.findByIdAndUpdate(bookInstance.id, bookInstance)
            .exec(function(err, result){
                if(err){return next(err)};

                res.redirect(result.url);
            })
        }
    }
];