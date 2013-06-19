~function(win, doc, undefined) {

var toString = Object.prototype.toString
var Util = {}

// Iterator
var forEach = Util.forEach = function(obj, iterator, context) {
	if ( obj.length === +obj.length ) {
		for (var i=0; i<obj.length; i++) {
			if (iterator.call(context, obj[i], i, obj) === true) return
		}
	} else {
		for (var k in obj) {
			if (iterator.call(context, obj[k], k, obj) === true) return
		}
	}
}

// IO.isArray, IO.isBoolean, ...
forEach(['Array', 'Boolean', 'Function', 'Object', 'String', 'Number'], function(name) {
	Util['is' + name] = function(obj) {
		return toString.call(obj) === '[object ' + name + ']'
	}
})
