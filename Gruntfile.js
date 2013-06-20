module.exports = function(grunt) {
	"use strict";
	
	var banner = function() {
		var date = new Date,
			h = date.getHours(),
			m = date.getMinutes(),
			s = date.getSeconds();
			
		h = h<10 ? '0'+h : h;
		m = m<10 ? '0'+m : m;
		s = s<10 ? '0'+s : s;
		
		var time = h + ':' + m + ':' + s;
		
		var str = '/*!\n';
		str += ' * <%= pkg.name %>.js v<%= pkg.version %>\n';
		str += ' * <%= pkg.repository.url %>\n';
		str += ' * Original idea: www.livevalidation.com (Copyright 2007-2010 Alec Hill)\n';
		str += ' * <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> ' + time + '\n';
		str += ' *\n'
		str += ' */\n';
		
		return str;
	}();
	
	// 配置
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			source: {
				src: ['src/validate.js', 'src/validation.js', 'src/validationForm.js']
			}
		},
		concat: {
			options: {
				banner: banner
			},
			// 核心版
			standalone: {
				// intro在首部，outro在尾部
				src: ['src/intro.js', 'src/selector.js', 'src/base.js', 'src/validate.js', 'src/validation.js', 'src/validationForm.js', 'src/outro.js'],
				dest: 'validation.standalone.src.js'
			},
			// jquery
			jquery: {
				src: ['src/intro.js', 'src/base.js', 'src/validate.js', 'src/validation.js', 'src/validationForm.js', 'src/outro.js'],
				dest: 'validation.jquery.src.js'
			}
		},
		uglify: {
			options: {
				banner: banner
			},
			standalone: {
				src: ['validation.standalone.src.js'],
				dest: 'validation.standalone.js'
			},
			jquery: {
				src: ['validation.jquery.src.js'],
				dest: 'validation.jquery.js'
			}
		}
	});
	
	// 载入concat和uglify插件，分别对于合并和压缩
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	// grunt.loadNpmTasks('grunt-contrib-jshint');
	
	// 注册任务
	grunt.registerTask('default', ['concat', 'uglify']);
}; 