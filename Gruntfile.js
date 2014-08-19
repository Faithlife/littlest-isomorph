var fork = require('child_process').fork;

module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      client: {
        src: ['lib/client.js'],
        dest: 'public/bundle.js',
        options: {
          transform: ['envify', 'reactify']
        }
      }
    },
    watch: {
      scripts: {
        files: ['lib/**/*.js', 'lib/**/*.jsx', 'lib/**/*.json'],
        tasks: ['browserify'],
        options: {
          atBegin: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('server', function () {
    grunt.util.spawn({
      cmd: 'node',
      args: [
        './node_modules/supervisor/lib/cli-wrapper.js',
        '-w', 'public',
        '-e', 'html,js,json',
        'index.js'
      ],
      opts: {
        stdio: 'inherit'
      }
    }, function () {
      grunt.fail.fatal(new Error('Supervisor quit.'));
    });
  });

  grunt.registerTask('default', ['browserify']);
  grunt.registerTask('dev', ['server', 'watch']);
};
