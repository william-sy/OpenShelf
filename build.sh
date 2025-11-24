docker buildx build --platform linux/amd64 -t williamsy/openshelf-be:2.1.2 ./backend --load
docker buildx build --platform linux/amd64 -t williamsy/openshelf-fe:2.1.2 ./frontend --load
docker push williamsy/openshelf-be:2.1.2 && docker push williamsy/openshelf-fe:2.1.2
