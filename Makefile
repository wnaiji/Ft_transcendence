all:
	docker compose up --build --detach || sudo docker compose up --build --detach
	./migratedb.sh
	./rootdb.sh
	docker compose up --build || { if [ $$? -ne 130 ]; then sudo docker compose up --build; fi; }

detach:
	docker compose up --build --detach || sudo docker compose up --build --detach
	./migratedb.sh
	./rootdb.sh

cdown:
	docker compose down -v || sudo docker compose down -v

dockerclean: cdown
	docker stop $$(docker ps -qa) 2>/dev/null || true
	docker rm $$(docker ps -qa) 2>/dev/null || true
	docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	docker network rm $$(docker network ls -q) 2>/dev/null || true
	sudo docker stop $$(sudo docker ps -qa) 2>/dev/null || true
	sudo docker rm $$(sudo docker ps -qa) 2>/dev/null || true
	sudo docker volume rm $$(sudo docker volume ls -q) 2>/dev/null || true
	sudo docker network rm $$(sudo docker network ls -q) 2>/dev/null || true
	docker run --rm -v /home/yobouhle/Cursus/Transcendence:/mnt busybox sh -c "rm -rf /mnt/postgres_volume" || true

# bad because this remove images installed
baddockerclean: dockerclean
	docker rmi -f $$(docker images -qa) 2>/dev/null || true
	docker system prune -a --volumes -f 2>/dev/null  || true
	sudo docker rmi -f $$(sudo docker images -qa) 2>/dev/null || true
	sudo docker system prune -a --volumes -f 2>/dev/null || true




# ************************ work only if you have sudo ************************
volumeclean:
	sudo rm -rf media_volume postgres_volume static_volume 2>/dev/null || true
	sudo find backend/app -type f -path '*/migrations/[0-9][0-9][0-9][0-9]_*.py' -exec rm -f {} \; 2>/dev/null || true
	docker run --rm -v .:/mnt busybox sh -c "rm -rf /mnt/postgres_volume"

dockervolumeclean: dockerclean volumeclean

# bad because this remove images installed
baddockervolumeclean: baddockerclean volumeclean

.PHONY: all detach cdown dockerclean baddockerclean volumeclean dockervolumeclean baddockervolumeclean
