FROM postgres:18.4-alpine

COPY railway-backup.dump /backup/railway-backup.dump
COPY .aws-restore-temp/restore.sh /restore.sh

RUN chmod 700 /restore.sh

ENTRYPOINT ["/restore.sh"]
