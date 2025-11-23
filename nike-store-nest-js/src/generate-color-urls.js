const baseUrl = "https://pub-e7f6a07e25ff4108aeb63c55fda4d1aa.r2.dev/pegasus-trail-5";

const colorFolders = [
  { name: "Black Anthracite", hex: "#000000", folder: "FQ0908-002_Black_Anthracite_Black" },
  { name: "Smoky Blue", hex: "#87CEEB", folder: "FQ0908-005_Smoky_Blue_Light_Silver_Armoury_Navy_Smo" },
  { name: "Light Silver Clay Green", hex: "#90EE90", folder: "FQ0908-013_Light_Silver_Clay_Green_Mint_Foam_Seawee" },
  { name: "Summit White", hex: "#F5F5F5", folder: "FQ0908-102_Summit_White_Light_Silver_College_Grey_S" },
  { name: "Sail Glacier Blue", hex: "#ADD8E6", folder: "FQ0908-104_Sail_Glacier_Blue_Dark_Team_Red_Hyper_Cr" },
  { name: "Jade Horizon", hex: "#00A86B", folder: "FQ0908-300_Jade_Horizon_Bicoastal_Pale_Ivory_Armour" },
  { name: "Fir Clay Green", hex: "#228B22", folder: "FQ0908-301_Fir_Clay_Green_Desert_Ochre_Bright_Crims" },
  { name: "Blue Beyond", hex: "#4169E1", folder: "FQ0908-400_Blue_Beyond_Copper_Moon_Monarch_Blue_Voi" },
  { name: "Red Stardust", hex: "#DC143C", folder: "FQ0908-600_Red_Stardust_Bicoastal_Vivid_Grape_Green" }
];

const colors = colorFolders.map(color => {
  const images = [];
  for (let i = 0; i <= 8; i++) {
    images.push(`${baseUrl}/${color.folder}/image_${String(i).padStart(3, '0')}.png`);
  }
  
  return {
    colorName: color.name,
    hex: color.hex,
    thumbnail: images[0],
    images: images
  };
});

console.log(JSON.stringify({ colors }, null, 2));