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

function addClass(elem, str) {
    if (win.jQuery) {
        return win.jQuery(elem).addClass(str)
    } else if (typeof domClass !== 'undefined') {
        return domClass.add(elem, str)
    }
}

function removeClass(elem, str) {
    if (win.jQuery) {
        return win.jQuery(elem).removeClass(str)
    } else if (typeof domClass !== 'undefined') {
        return domClass.remove(elem, str)
    }
}

// Error class
function ZVError(errorMsg) {
    this.message = errorMsg
    this.name = 'ValidationError'
}