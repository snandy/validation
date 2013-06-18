
Validation.add('zv1', 'numericality')
Validation.add('zv2', 'numericality')

var zv3Obj = new Validation('zv3')
zv3Obj.add('numericality', {onlyInteger: true})

var zv4Obj = new Validation('zv4')
zv4Obj.add('numericality', {is: 5})

var zv5Obj = new Validation('zv5')
zv5Obj.add('numericality', {min: 5})

var zv6Obj = new Validation('zv6')
zv6Obj.add('numericality', {max: 5})

var zv7Obj = new Validation('zv7')
zv7Obj.add('numericality', {min: 2, max: 5})

var zv8Obj = new Validation('zv8')
zv8Obj.add('numericality', {min: 2, max: 5, onlyInteger: true})

var zv9Obj = new Validation('zv9')
zv9Obj.add('size', {is: 4})

var zv10Obj = new Validation('zv10')
zv10Obj.add('size', {min: 4})

var zv11Obj = new Validation('zv11')
zv11Obj.add('size', {max: 4})

var zv12Obj = new Validation('zv12')
zv12Obj.add('size', {min: 4, max: 10})

var zv13Obj = new Validation('zv13')
zv13Obj.add('inclusion', {within: [ 'apple' , 'banana', 'orange' ]})

var zv14Obj = new Validation('zv14')
zv14Obj.add('inclusion', {within: [ 'apple' , 'banana', 'orange' ], partialMatch: true})

var zv15Obj = new Validation('zv15')
zv15Obj.add('exclusion', {within: [ 'apple' , 'banana', 'orange' ]})

var zv16Obj = new Validation('zv16')
zv16Obj.add('exclusion', {within: [ 'apple' , 'banana', 'orange' ], partialMatch: true})

var zv17Obj = new Validation('zv17')
zv17Obj.add('format', { pattern: /love/i })

Validation.add('zv18', 'email')

Validation.add('zv19', 'chinese')

var zv20Obj = new Validation('zv20')
zv20Obj.add('presence')
zv20Obj.add('chinese')

var zv21Obj = new Validation('zv21')
zv21Obj.add('presence')
zv21Obj.add('chinese')
zv21Obj.add('size', {min: 4, max: 10})











