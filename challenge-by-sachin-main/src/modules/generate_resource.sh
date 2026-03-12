#!/bin/bash
resources=("office" "center" "bank" "client" "group" "audit" "collectionSheet" "report" "product" "provinces" "town" "language" "gender" "meetingDates" "attendance" "transactionType" "transaction")

for resource in "${resources[@]}"
do
  nest g resource $resource --type rest
done
