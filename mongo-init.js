db.createUser(
    {
        user: "exchange",
        pwd: "exchange",
        roles: [
            {
                role: "readWrite",
                db: "walletDB"
            }
        ]
    }
);