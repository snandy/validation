/*
 * 自执行验证，通过element上的Script的data-run="true"
 * 
 */
~function() {
    var oldOnload = win.onload
    win.onload = function() {
        var canRun = single('script[data-run=true]')
        if (!canRun) return
        var selector = canRun.getAttribute('data-container')
        var container = $(selector)
        Validation.init(container)
        if (oldOnload) oldOnload.call(win)
    }
}()
