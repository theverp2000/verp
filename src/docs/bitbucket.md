ATBBxQcTvqDDeyZf3FBLtFdGsgpcE2FD547F

git clone https://toanthuan@bitbucket.org/toanthuan/verp.git

git config --global --add safe.directory F:/Programs/Nodejs/Toverp/verp
git config --global user.name "Thuan Luong"
git config --global user.email toanthuan@gmail.com

git remote remove origin
git remote add origin https://toanthuan@bitbucket.org/toanthuan/verp.git

git add *
git commit -m "Ghi chú Commit"
git push origin master