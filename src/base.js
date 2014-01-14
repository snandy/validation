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
    if (win.jQuery) {
        return win.jQuery(selector)
    } else if (typeof query !== 'undefined') {
        return query(selector)
    }
}
function single(selector) {
    return $(selector)[0]
}
Util.$ = $

// Error class
function ZVError(errorMsg) {
    this.message = errorMsg
    this.name = 'ValidationError'
}