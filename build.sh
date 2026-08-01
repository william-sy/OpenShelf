docker buildx build --platform linux/amd64 -t williamsy/openshelf-be:2.1.6 ./backend --load
docker buildx build --platform linux/amd64 -t williamsy/openshelf-fe:2.1.6 ./frontend --load
docker push williamsy/openshelf-be:2.1.6 && docker push williamsy/openshelf-fe:2.1.6