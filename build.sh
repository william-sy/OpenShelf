docker buildx build --platform linux/amd64 -t williamsy/openshelf-be:1.5.1 ./backend --load
docker buildx build --platform linux/amd64 -t williamsy/openshelf-fe:1.5.1 ./frontend --load
docker push williamsy/openshelf-be:1.5.1 && docker push williamsy/openshelf-fe:1.5.1
