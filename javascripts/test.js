
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