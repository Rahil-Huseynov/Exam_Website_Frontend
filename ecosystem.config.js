module.exports = {
  apps: [
    {
      name: "exam-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3003",
      cwd: "/mnt/Disk_1TB/Exam_Website/Exam_Website_Frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
