/**
 * 根据输入域的data-validate进行初始化，只需添加data-validate属性就自动完成验证，无需写一行JS代码
 * @param {DOM Element} container
 */
var oldOnload = win.onload
win.onload = function() {
    var run = single('script[data-run=true]')
    if (!run) return
    var selector = run.getAttribute('data-container')
    var container = $(selector)
    var elems = $('[data-validate]', container)
    Util.forEach(elems, function(elem) {
        var vali = new Validation(elem)
        vali.add(elem.getAttribute('data-validate'))
    })
    if (oldOnload) oldOnload.call(win)
}

