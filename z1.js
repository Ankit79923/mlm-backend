



// Function to generate unique sponsor ID
async function generateUniqueSponsorID() {
  let isUnique = false;
  let randomNumber;
  
  // Keep generating until a unique number is found
  while (!isUnique) {
    randomNumber = generateRandom7DigitNumber();
    const existingUser = await User.findOne({ sponsorID: `UD${randomNumber}` });
    if (!existingUser) {
      isUnique = true; // The generated number is unique
    }
  }
  
  return `UD${randomNumber}`;
}




// Function to generate random 7-digit number
function generateRandom7DigitNumber() {
    const min = 1000000; // Minimum 7-digit number
    const max = 9999999; // Maximum 7-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



let number = generateRandom7DigitNumber();
console.log(number);
console.log();


