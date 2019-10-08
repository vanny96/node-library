var async = require('async');
var Book = require('../model/book');
var Author = require('../model/author');

const validator = require('express-validator');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
          .sort([['family_name', 'ascending']])
          .exec(function(err, data){
                if(err) {return next(err)}
                res.render('authorlist', {title: 'Author List', authorlist: data})
          })
};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback){
                    Author.findById(req.params.id)
                    .exec(callback)
        },

        books: function(callback){
                    Book.find({'author': req.params.id}, 'title summary')
                        .exec(callback)
        }
    }, function(err, result){
        if(err) {return next(err)}
        if (result.author==null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('authordetails', {title: result.author.name, author: result.author, books: result.books});
    })
          
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('authorform', {title: 'Title Form'});
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate fields.
    validator.body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    validator.body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    validator.body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    validator.body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    validator.sanitizeBody('first_name').escape(),
    validator.sanitizeBody('family_name').escape(),
    validator.sanitizeBody('date_of_birth').toDate(),
    validator.sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('authorform', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('authordelete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
    });

};


// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    Author.findById(req.params.id)
    .exec(function(err, result){
        if(err){return next(err)}

        console.log(result.date_of_birth);
        res.render('authorform', { title: 'Update Author', author: result});
    })
};

// Handle Author update on POST.
exports.author_update_post = [
    // Validate fields.
    validator.body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    validator.body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    validator.body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    validator.body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    validator.sanitizeBody('first_name').escape(),
    validator.sanitizeBody('family_name').escape(),
    validator.sanitizeBody('date_of_birth').toDate(),
    validator.sanitizeBody('date_of_death').toDate(),

    function(req, res, next) {
        const errors = validator.validationResult(req);

        var author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        })

        if(!errors.isEmpty()){
            res.render('authorform', { title: 'Update Author', author: author, errors: errors.array()})
        }

        Author.findByIdAndUpdate(author.id, author)
        .exec(function(err, result){
            if(err) {return next(err)}

            res.redirect(result.url);
        })
    }
];