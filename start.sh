export TYPEORM_CONNECTION=postgres
export TYPEORM_HOST=localhost
export TYPEORM_USERNAME=yun
export TYPEORM_PASSWORD=
export TYPEORM_DATABASE=stone11_rollup
export TYPEORM_PORT=5432
export TYPEORM_SYNCHRONIZE=true
export TYPEORM_LOGGING=false
export TYPEORM_ENTITIES=src/orm/*Entity.ts
export USE_LOG_FILE=false

export EXECUTOR_PORT=4000
export BATCH_PORT=4001

export L1_LCD_URI=http://34.124.138.58:1317
export L1_RPC_URI=http://34.124.138.58:26657
export L2_LCD_URI=http://34.84.105.49:1317
export L2_RPC_URI=http://34.84.105.49:26657
export L2ID=stone11free2


# executor config
export EXECUTOR_MNEMONIC='retire robot trial output harvest wheat struggle horror comfort lion mesh sell cabin select clip convince anchor kingdom sport flush patient rice walnut oval'

# batch submitter config
export BATCH_SUBMITTER_MNEMONIC='broken umbrella tent include pet simple amount renew insect page sound whip shock dynamic deputy left outside churn lounge raise mirror toss annual fat'

# challenger config
export CHALLENGER_MNEMONIC='purity yard brush wagon note forest athlete seek offer clown surround cover present ski bargain obvious cute admit gloom text shaft super impose rubber'

# output submitter config
export OUTPUT_SUBMITTER_MNEMONIC='airport hidden cake dry bleak alcohol enough tower charge cash modify feature analyst suffer bus oyster initial coffee wine plug paper damp sock afraid'
export EXECUTOR_URI=http://localhost:4000

npm run executor
