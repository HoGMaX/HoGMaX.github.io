
const { src, dest, watch, series } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();

// ============================================================
// PATHS — зміни тут, якщо зміниться структура проєкту
// ============================================================
const paths = {
    scss: 'css/scss/**/*.scss',
    css: 'css/*.css',
    minCss: 'css/min-css',
    html: ['**/*.html', '!node_modules/**/*.html'],
    js: ['js/**/*.js', '!node_modules/**/*.js'],
    assets: 'assets/**/*',
};

// ============================================================
// PLUGIN EXTENSION POINTS
// Додавай нові require() на початку файлу,
// а самі плагіни — у відповідні завдання нижче.
// Наприклад: Autoprefixer, оптимізація зображень тощо.
// ============================================================

// SCSS → звичайний CSS
function styles() {
    return src(paths.scss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        // Місце для додаткових CSS-плагінів
        .pipe(sourcemaps.write('.'))
        .pipe(dest('css'))
        .pipe(browserSync.stream());
}

// CSS → мінімізований CSS + Source Maps
function minifyStyles() {
    return src(paths.css)
        .pipe(sourcemaps.init({ loadMaps: true }))
        // Місце для додаткових плагінів оптимізації CSS
        .pipe(cleanCSS())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.minCss))
        .pipe(browserSync.stream());
}

// Локальний сервер у корені artistic/
function serve(done) {
    browserSync.init({
        server: { baseDir: '.' },
        port: 3000,
        open: false,
        notify: false,
    });

    done();
}

// Стеження за файлами
function watching() {
    watch(paths.scss, series(styles, minifyStyles));
    watch(paths.html).on('change', browserSync.reload);
    watch(paths.js).on('change', browserSync.reload);
    watch(paths.assets).on('change', browserSync.reload);
}

// ============================================================
// TASKS
// ============================================================

// Одноразова збірка без запуску сервера
const build = series(styles, minifyStyles);

// Розробка: збірка → сервер → автоматичне стеження
const dev = series(build, serve, watching);

exports.styles = styles;
exports.minifyStyles = minifyStyles;
exports.build = build;
exports.dev = dev;
exports.default = dev;
