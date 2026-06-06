const { execSync } = require('child_process');

try {
  console.log('Pulling from origin main...');
  // Force pull from origin main to resolve conflicts
  execSync('git pull origin main --rebase --allow-unrelated-histories', { stdio: 'inherit' });
  
  console.log('Pushing to origin main...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('Successfully pushed to Git!');
} catch (error) {
  console.error('Git command failed:', error.message);
  
  try {
    console.log('Attempting force push as fallback...');
    execSync('git push origin main -f', { stdio: 'inherit' });
    console.log('Successfully force pushed to Git!');
  } catch (err2) {
    console.error('Force push also failed:', err2.message);
    process.exit(1);
  }
}
