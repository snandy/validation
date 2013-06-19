// field type
var TYPE = {
    textarea: 1,
    text: 2,
    password: 3,
    checkbox: 4,
    select: 5,
    file: 6 
}

// empty function
function noop() {}

// If the jQuery exists, use it
function $(selector) {
    return win.jQuery ? win.jQuery(selector)[0] : query(selector)[0]
}

// Error class
function ZVError(errorMsg) {
    this.message = errorMsg
    this.name = 'ValidationError'
}