'use strict';

// --------------------------------------------------------------------------
// Plugins
// --------------------------------------------------------------------------

var gulp         = require('gulp'),
	browserSync  = require('browser-sync'),
	watch 		 = require('gulp-watch'),
	runSequence  = require('run-sequence'),

	concat		 = require('gulp-concat'),
	plumber 	 = require('gulp-plumber'),
	include      = require("gulp-include"),

	critical     = require('critical'),

	sourcemaps = require('gulp-sourcemaps'),

	pug          = require('gulp-pug'),
	frontMatter  = require('gulp-front-matter'),
	cached       = require('gulp-cached'),
	changed = require('gulp-changed'),

	sass 		 = require('gulp-sass'),
	uncss        = require('gulp-uncss'),
	autoprefixer = require('gulp-autoprefixer'),
	minify_css   = require('gulp-minify-css'),
	cleanCSS     = require('gulp-clean-css'),

	
	uglify 		 = require('gulp-uglify'),

	streamify    = require('gulp-streamify'),
	
	
	spritesmith  = require('gulp.spritesmith'),
	cheerio 	 = require('gulp-cheerio'),
	svgmin       = require('gulp-svgmin'),
	svgSprite    = require("gulp-svg-sprite"),
	replace      = require('gulp-replace'),

	clean        = require('del'),

	zip      	 = require('gulp-zip'),

	notify      = require("gulp-notify"),

	yaml         = require('require-yaml'),
	consolidate  = require('gulp-consolidate'),
	cache        = require('gulp-cache'),


	path          = require('path'),
	babel 		  = require("gulp-babel"),

	gulpif        = require('gulp-if'),
 	rename        = require('gulp-rename'),
 	browserify    = require('browserify'),
 	babelify      = require('babelify'),
 	source        = require('vinyl-source-stream');





// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------


var src = {
	pagelist: 'src/yaml/index.yaml',
	html: 'src/pug/**/[^_]*.pug',
	fonts: 'src/fonts/*',
	scss: 'src/scss/**/*.scss',
	js: 'src/js/**/*.js',
	images: 'src/images/**/*',
	
	spriteImages: 'src/sprites/_images/',
	spriteSvg: 'src/sprites/_svg/*.svg'
};

var dist = {
	pagelist: 'dist/',
	html: 'dist/',
	fonts: 'dist/fonts/',
	css: 'dist/css',
	js: 'dist/js',
	images: 'dist/images/',

	spriteImages: 'dist/sprites/',
	spriteSvg: 'dist/sprites/'
};


// --------------------------------------------------------------------------
// Zip
// --------------------------------------------------------------------------



gulp.task('zip', () => {

	function correctNumber(i) {
	    if (i < 10) {
	        i = "0" + i;
	    }
	    return i;
	}

	var zipName = path.basename(__dirname);
	var zipDate = new Date();
	var zipDatetime = zipDate.getFullYear() + '.' + correctNumber((zipDate.getMonth() + 1)) + '.' + correctNumber(zipDate.getDate()) + 'T' + correctNumber(zipDate.getHours()) + ':' + correctNumber(zipDate.getMinutes())
	var zipFullname = zipName + '_' + zipDatetime + '.zip';

	
    gulp.src(['./**', '!./node_modules/', '!./node_modules/**', '!./*.zip'])
        .pipe(zip(zipFullname))
        .pipe(gulp.dest('./'))
});


// --------------------------------------------------------------------------
// Sprites
// --------------------------------------------------------------------------


gulp.task('spriteImages', function () {
	var spriteData = gulp.src(src.spriteImages + '*.png')
	.pipe(plumber({
		errorHandler: notify.onError("Error: <%= error.message %>")
	}))
	.pipe(spritesmith({

		algorithm: 'binary-tree',
		padding: 10,

		cssName: '_sprites.scss',
		cssFormat: 'scss',

	    imgName: 'sprite.png',
	    imgPath: '../sprites/sprite.png',

	    retinaSrcFilter: src.spriteImages + '/*@2x.png',
        retinaImgName: 'sprite@2x.png',
        retinaImgPath: '../sprites/sprite@2x.png',

	    cssTemplate: 'src/sprites/_templates/sprite.template.mustache'

	}));

	spriteData.img.pipe(gulp.dest('dist/sprites/'));
	spriteData.css.pipe(gulp.dest('src/sprites/'));

	return spriteData;
});



gulp.task('spriteSvg', function () {
    return gulp
        .src(src.spriteSvg)
        .pipe(cheerio({
			run: function ($) {

				$('[fill]:not([fill="currentColor"])').removeAttr('fill');

				// $('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				// $('[style]').removeAttr('style');
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
        	mode: {
				symbol: {
					dest: "",
					prefix : '.',
            		dimensions : '.',
					sprite: "sprite.svg",
					render: {
						scss: {
							dest:'../../src/sprites/_spritesSvg.scss',
							template: "src/sprites/_templates/scss.templateSvg.handlebars"
						}
					}
				}
			}
			
        }))
        .pipe(gulp.dest('dist/sprites/'));
});


// --------------------------------------------------------------------------
// Critical
// --------------------------------------------------------------------------

gulp.task('critical', function () {

	critical.generate({
		base: './',
		inline: false,
		src: 'dist/critical.html',
		css: 'dist/css/app.min.css',
		dimensions: [{
			width: 1920,
			height: 2000
		}],
		dest: 'src/critical/critical.css',
		minify: true,
		extract: true,
		ignore: ['@font-face']
	});

});

// --------------------------------------------------------------------------
// Html or Pug
// --------------------------------------------------------------------------

gulp.task('html', function() {

	return gulp.src(src.html)
			
		.pipe(plumber({
			errorHandler: notify.onError("Error: <%= error.message %>")
		}))
		
		
		.pipe(frontMatter({ property: 'data' }))
		// .pipe(changed('dist', {extension: '.html'}))
		.pipe(pug({
			pretty: false
		}))
		.pipe(cached('pug'))
		.pipe(gulp.dest(dist.html))
		.pipe(browserSync.reload({ stream: true }))

});

// --------------------------------------------------------------------------
// Fonts
// --------------------------------------------------------------------------

gulp.task('fonts', function() {
    gulp.src(src.fonts)
        .pipe(gulp.dest(dist.fonts))
        .pipe(browserSync.reload({ stream: true }))
});


// --------------------------------------------------------------------------
// Images
// --------------------------------------------------------------------------


gulp.task('images', function() {

	return gulp.src(src.images)
		.pipe(gulp.dest(dist.images))
		.pipe(browserSync.reload({ stream: true }))

});

// --------------------------------------------------------------------------
// Scss
// --------------------------------------------------------------------------

gulp.task('scss', function() {

	return gulp.src(src.scss)
		
		.pipe(plumber({
			errorHandler: notify.onError("Error: <%= error.message %>")
		}))
		.pipe(sass())
		.pipe(autoprefixer({
		    browsers: ['last 2 versions', '> 1%', 'ie 9'],
		    cascade: false
		}))

		// .pipe(uncss({
		// 	html: ['src/**/*.html'],
		// 	ignore: [/\.is-*/, /\.flexboxlegacy/, /\.backgroundblendmode/, /\.fancybox*/, /\.scroll*/, /\.jq-*/]
		// }))

		.pipe(concat('app.min.css'))
		.pipe(minify_css())
		.pipe(cleanCSS({compatibility: 'ie8'}))
		
		.pipe(gulp.dest(dist.css))
		.pipe(browserSync.reload({ stream: true }))

});


// --------------------------------------------------------------------------
// Js
// --------------------------------------------------------------------------



gulp.task('js:plugins', function() {
  return gulp.src([
  	  path.resolve('node_modules', 'svg4everybody/dist/svg4everybody.js'),
      path.resolve('node_modules', 'jquery/dist/jquery.js'),
      
   
      path.resolve('node_modules', 'slick-carousel/slick/slick.js'),
      path.resolve('node_modules', 'magnific-popup/dist/jquery.magnific-popup.js'),

      path.resolve('node_modules', 'jquery-mousewheel/jquery.mousewheel.js'),
      path.resolve('node_modules', 'malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js'),

      path.resolve('node_modules', 'jquery-validation/dist/jquery.validate.js'),
      path.resolve('node_modules', 'inputmask/dist/jquery.inputmask.bundle.js'),
      path.resolve('node_modules', 'jquery-form-styler/dist/jquery.formstyler.js'),
      path.resolve('node_modules', 'ion-rangeslider/js/ion.rangeSlider.js'),
      path.resolve('node_modules', 'air-datepicker/dist/js/**/*.js'),

      path.resolve('node_modules', 'jquery.animate-number/jquery.animateNumber.js'),
      path.resolve('node_modules', 'jquery-lazy/jquery.lazy.js'),
      path.resolve('node_modules', 'readmore-js/readmore.js'),
      path.resolve('node_modules', 'scrollMonitor/scrollMonitor.js'),
      path.resolve('node_modules', 'match-media/matchMedia.js'),

      // config.src.js + '/plugins/**/*.js'
     ])
    .pipe(plumber({
			errorHandler: notify.onError("Error: <%= error.message %>")
	}))
	
    .pipe(concat('plugins.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dist.js))
	.pipe(browserSync.reload({ stream: true }))
});


// gulp.task('js:app', function() {
//   return gulp.src('src/js/app.js')
//   	.pipe(plumber({
// 		errorHandler: notify.onError("Error: <%= error.message %>")
// 	}))
// 	.pipe(babel())
//     .pipe(concat('app.min.js'))
//     .pipe(gulp.dest(dist.js))
// });


gulp.task('js:app', function() {
	browserify({
	    entries: 'src/js/app.js',
	    debug: true
	})

    .transform(babelify.configure({
      sourceMapRelative: dist.js // tells babelify to use this instead of an absolute path in the source map (so you can debug the individual source files)
    }))

	.bundle()


	.pipe(plumber({
		errorHandler: notify.onError("Error: <%= error.message %>")
	}))

    .pipe(source('app.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(dist.js))
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('js', [
  'js:plugins',
  'js:app'
]);

// gulp.task('javascript:watch', function() {
//   gulp.watch(config.src.js + '/plugins/**/*.js', ['javascript:plugins']);
//   gulp.watch(config.src.js + '/*.js', ['javascript:app']);
// });

// gulp.task('js', function() {
// 	return gulp.src('src/js/app.js')

// 		.pipe(plumber({
// 			errorHandler: notify.onError("Error: <%= error.message %>")
// 		}))

// 		.pipe(sourcemaps.init())
		
// 		// .pipe(include({
// 		// 	extensions: "js",
// 		//     hardFail: false,
// 		//     includePaths: [
// 		//       __dirname + "/node_modules/",
// 		//       __dirname + "/src/js/modules"
// 		//     ]
// 		// }))
// 		.pipe(uglify())

// 		// .pipe(babel())
// 		.pipe(concat('app.min.js'))
// 		.pipe(sourcemaps.write("."))
		
// 		.pipe(gulp.dest(dist.js))
// 		.pipe(browserSync.reload({ stream: true }))
// });

// --------------------------------------------------------------------------
// PageList
// --------------------------------------------------------------------------

gulp.task('pages', function() {
	delete require.cache[require.resolve(__dirname + '/src/yaml/index.yaml')]
	var pages = require(__dirname + '/src/yaml/index.yaml');
	return gulp.src(__dirname + '/src/yaml/index.html')
		.pipe(consolidate('lodash', {
			pages: pages
		}))
		.pipe(gulp.dest(dist.pagelist))
		.pipe(browserSync.reload({ stream: true }));

});

// --------------------------------------------------------------------------
// Clean
// --------------------------------------------------------------------------

gulp.task('clean', function() {
	return clean.sync('dist/');
});

// --------------------------------------------------------------------------
// Watch
// --------------------------------------------------------------------------


gulp.task('watch', function() {
	
	gulp.watch(src.spriteImages + '*.png', ['spriteImages']);
	gulp.watch(src.spriteSvg, ['spriteSvg']);

	gulp.watch(src.pagelist, ['pages']);
	gulp.watch(src.html, ['html']);



	gulp.watch(['src/pug/**/_*.pug', 'src/pug//**/[^_]*.pug'], ['html']);
  	// gulp.watch(['src/pug//**/[^_]*.pug'], ['html']);

	gulp.watch(src.fonts, ['fonts']);
	gulp.watch(src.images, ['images']);
	gulp.watch(src.scss, ['scss']);
	gulp.watch(src.js, ['js']);

	browserSync.init({
		server: 'dist/',
		port: 8080,
		open: true,
    	notify: false
	});
	
});


// Gulp

gulp.task('default', function() {

	runSequence('clean', 'spriteImages', 'spriteSvg', 'js', 'scss', 'html', 'fonts', 'images', 'pages', 'watch')

});

// gulp.task('default', ['clean', 'scss', 'html', 'js', 'fonts', 'images', 'spriteImages', 'spriteSvg', 'pages', 'watch']);


