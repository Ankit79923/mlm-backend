const bcrypt = require('bcrypt');


describe("Testing the hashed password", function(){
    it("should generate a hashed password", async function(){
        const password = "password123";
        const hashedPassword = bcrypt.hash(password, 10);
        console.log("Password: ", password);
        console.log("Hashed Password: ", hashedPassword);
        
        expect(2*2).not.toBe(4);
    });

    it("should compare a hashed password with a provided password", async function(){
        const hashedPassword = await bcrypt.hash("password123", 10);
        const isMatch = await bcrypt.compare("password123", hashedPassword);
        console.log("Is Password Match: ", isMatch);
    });
});


