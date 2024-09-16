// gulpfile.js
import gulp from 'gulp';
import ts from 'gulp-typescript';
import { exec } from 'child_process';
const tsProject = ts.createProject('tsconfig.json');

// Task to compile TypeScript files
gulp.task('compile-ts', function () {
  return tsProject.src()
    .pipe(tsProject())
    .pipe(gulp.dest('dist'));
});

// Task to copy JavaScript files as-is
gulp.task('copy-js', function () {
  return gulp.src('src/**/*.js')
    .pipe(gulp.dest('dist'));
});

gulp.task('build:proxy', function (cb) {
  exec('tsc --project proxy/tsconfig.json', function (err, stdout, stderr) {
    if (err) {
      console.error(stderr);
      cb(err); // Call callback with error
    } else {
      console.log(stdout);
      cb(); // Call callback when done
    }
  });
});

// Default task to run both 'compile-ts' and 'copy-js'
gulp.task('build', gulp.series('compile-ts', 'copy-js', 'build:proxy'));