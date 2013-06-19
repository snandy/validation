/*
 * 自执行验证，通过element上的data-validate属性
 * 
 */
~function(Validation) {
	var Util = Validation.Util
	var elems = query('[data-validate]')
	Util.forEach(elems, function(elem) {
		var vali = new Validation(elem)
		vali.add(elem.getAttribute('data-validate'))
	})
}(Validation);