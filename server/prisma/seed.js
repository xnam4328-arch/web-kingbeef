const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function buildGridTables(hallId, numbers, cols, spacingX, spacingZ, capacities) {
  const rows = Math.ceil(numbers.length / cols);
  return numbers.map((tableNumber, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const posX = Number(((col - (cols - 1) / 2) * spacingX).toFixed(2));
    const posZ = Number(((row - (rows - 1) / 2) * spacingZ).toFixed(2));
    const capacity = Array.isArray(capacities)
      ? capacities[idx % capacities.length]
      : capacities;

    return {
      hallId,
      tableNumber,
      capacity,
      posX,
      posY: 0,
      posZ,
      status: 'available',
    };
  });
}

// Danh sach thuc don 52 mon — imageUrl tro ve /images/menu/<slug>.jpg (client/public/images/menu/)
const MENU_ITEMS = [
  // ===================== APPETIZERS (8) =====================
  {
    name: 'Thịt Hun Khói Cuộn Rau Củ Sốt Kimchi',
    category: 'Appetizers',
    description: 'Ba rọi hun khói thơm lừng cuộn rau củ tươi giòn, dùng kèm sốt Kimchi đậm đà kích thích vị giác.',
    price: 79000,
    imageUrl: '/images/menu/thit-hun-khoi-cuon-rau-cu-sot-kimchi.jpg',
  },
  {
    name: 'Sò Điệp Áp Chảo Sốt Trái Cây',
    category: 'Appetizers',
    description: 'Sò điệp Nhật áp chảo bơ vàng óng, hòa quyện cùng sốt trái cây nhiệt đới thanh mát.',
    price: 169000,
    imageUrl: '/images/menu/so-diep-ap-chao-sot-trai-cay.jpg',
  },
  {
    name: 'Lườn Ngỗng Xông Khói Sốt Chanh Dây',
    category: 'Appetizers',
    description: 'Lườn ngỗng hun khói mềm mọng cắt lát mỏng, phủ sốt chanh dây chua ngọt tinh tế kiểu Pháp.',
    price: 89000,
    imageUrl: '/images/menu/luon-ngong-xong-khoi-sot-chanh-day.jpg',
  },
  {
    name: 'Sườn Sốt Phô Mai Cay',
    category: 'Appetizers',
    description: 'Sườn non nướng mềm phủ lớp sốt phô mai béo ngậy hòa cùng vị cay nhẹ đầy cuốn hút.',
    price: 79000,
    imageUrl: '/images/menu/suon-sot-pho-mai-cay.jpg',
  },
  {
    name: 'Cá Hồi Canape',
    category: 'Appetizers',
    description: 'Bánh mì giòn kiểu Âu phủ kem phô mai thảo mộc và cá hồi Na Uy tươi béo ngậy.',
    price: 59000,
    imageUrl: '/images/menu/ca-hoi-canape.jpg',
  },
  {
    name: 'Bánh Mì Nướng Bơ Thảo Mộc',
    category: 'Appetizers',
    description: 'Bánh mì baguette nướng giòn rụm quyện bơ tỏi và lá hương thảo thơm nồng.',
    price: 29000,
    imageUrl: '/images/menu/banh-mi-nuong-bo-thao-moc.jpg',
  },
  {
    name: 'Khoai Môn Chiên Giòn Lắc Phô Mai',
    category: 'Appetizers',
    description: 'Khoai môn cắt sợi chiên vàng giòn tan, phủ bột phô mai mặn ngọt thơm béo.',
    price: 39000,
    imageUrl: '/images/menu/khoai-mon-chien-gion-lac-pho-mai.jpg',
  },
  {
    name: 'Khoai Tây Chiên Sốt Tỏi',
    category: 'Appetizers',
    description: 'Khoai tây chiên giòn kiểu Bỉ xóc bơ tỏi thơm lừng kèm sốt chấm đặc chế.',
    price: 39000,
    imageUrl: '/images/menu/khoai-tay-chien-sot-toi.jpg',
  },

  // ===================== SOUP (4) =====================
  {
    name: 'Soup Gà Cuộn Vị Tomyum',
    category: 'Soup',
    description: 'Súp kem nóng hổi kết hợp thịt gà cuộn mềm thơm và hương vị Tomyum chua cay tinh tế.',
    price: 89000,
    imageUrl: '/images/menu/soup-ga-cuon-vi-tomyum.jpg',
  },
  {
    name: 'Soup Kem Bí Đỏ',
    category: 'Soup',
    description: 'Bí đỏ Nhật ninh nhừ đánh mịn cùng kem tươi béo nhẹ, dùng kèm bánh mì nướng giòn.',
    price: 79000,
    imageUrl: '/images/menu/soup-kem-bi-do.jpg',
  },
  {
    name: 'Soup Hải Sản Kiểu Anh',
    category: 'Soup',
    description: 'Súp Chowder truyền thống nấu từ hải sản tươi ngọt, kem tươi và thảo mộc Âu.',
    price: 89000,
    imageUrl: '/images/menu/soup-hai-san-kieu-anh.jpg',
  },
  {
    name: 'Soup Tôm Càng Kem Béo',
    category: 'Soup',
    description: 'Nước dùng tôm càng ninh chậm sóng sánh cùng kem tươi thượng hạng và thịt tôm săn chắc.',
    price: 95000,
    imageUrl: '/images/menu/soup-tom-cang-kem-beo.jpg',
  },

  // ===================== SALAD (7) =====================
  {
    name: 'Salad Trái Cây Theo Mùa Sốt Sữa Chua Hy Lạp',
    category: 'Salad',
    description: 'Rau mầm hữu cơ và trái cây tươi theo mùa trộn sốt sữa chua Hy Lạp thanh mát.',
    price: 79000,
    imageUrl: '/images/menu/salad-trai-cay-sua-chua-hy-lap.jpg',
  },
  {
    name: 'Salad Burrata Nhà Làm - Trái Cây Theo Mùa & Sốt Rau Thơm Châu Á',
    category: 'Salad',
    description: 'Phô mai Burrata tươi béo mịn thủ công kết hợp trái cây chín mọng và sốt rau thơm độc quyền KingBeef.',
    price: 239000,
    imageUrl: '/images/menu/salad-burrata-nha-lam.jpg',
  },
  {
    name: 'Salad Lườn Cá Hồi Chiên Giòn Sốt Chanh Dây',
    category: 'Salad',
    description: 'Lườn cá hồi chiên giòn béo ngậy hòa quyện rau xanh giòn tươi và sốt chanh dây thơm lừng.',
    price: 69000,
    imageUrl: '/images/menu/salad-luon-ca-hoi-chien-gion.jpg',
  },
  {
    name: 'Salad Cá Ngừ Ngâm Dầu Sốt Kem Béo',
    category: 'Salad',
    description: 'Cá ngừ đại dương ngâm dầu ô liu trộn cùng rau xà lách tươi và sốt kem béo kiểu Âu.',
    price: 49000,
    imageUrl: '/images/menu/salad-ca-ngu-ngam-dau.jpg',
  },
  {
    name: 'Salad Hải Sản Hương Khói',
    category: 'Salad',
    description: 'Hải sản tươi áp chảo hương khói nhẹ kết hợp rau củ giòn và sốt giấm balsamic.',
    price: 49000,
    imageUrl: '/images/menu/salad-hai-san-huong-khoi.jpg',
  },
  {
    name: 'Salad Gà Nướng Thảo Mộc',
    category: 'Salad',
    description: 'Ức gà ướp thảo mộc nướng mềm mọng trên nền rau xanh tươi mát và sốt mè rang.',
    price: 49000,
    imageUrl: '/images/menu/salad-ga-nuong-thao-moc.jpg',
  },
  {
    name: 'Salad Rau Xanh Bò Cháy Cạnh',
    category: 'Salad',
    description: 'Thịt bò Mỹ áp chảo cháy cạnh thơm lừng dùng kèm rau xanh hữu cơ và sốt tiêu đen.',
    price: 49000,
    imageUrl: '/images/menu/salad-rau-xanh-bo-chay-canh.jpg',
  },

  // ===================== PASTA (6) =====================
  {
    name: 'Mì Ý Cua Cà Mau',
    category: 'Pasta',
    description: 'Sợi mì Ý al dente hòa quyện thịt cua Cà Mau chắc ngọt và sốt gạch cua béo thơm đặc trưng.',
    price: 129000,
    imageUrl: '/images/menu/mi-y-cua-ca-mau.jpg',
  },
  {
    name: 'Mì Ý Cá Hồi Sốt Kem Thì Là',
    category: 'Pasta',
    description: 'Cá hồi Na Uy áp chảo mềm béo dùng kèm mì Ý sốt kem tươi thơm dịu hương thì là.',
    price: 129000,
    imageUrl: '/images/menu/mi-y-ca-hoi-sot-kem-thi-la.jpg',
  },
  {
    name: 'Mì Ý Sốt Kem Cà Chua Hải Sản',
    category: 'Pasta',
    description: 'Hải sản tươi ngọt xào tỏi hòa quyện trong sốt hồng (kem cà chua) đậm vị chuẩn Ý.',
    price: 89000,
    imageUrl: '/images/menu/mi-y-sot-kem-ca-chua-hai-san.jpg',
  },
  {
    name: 'Mì Ý Tôm Càng Biển Xanh',
    category: 'Pasta',
    description: 'Tôm càng nướng bơ tỏi phục vụ cùng mì Ý sốt hải sản thanh ngọt đậm đà.',
    price: 129000,
    imageUrl: '/images/menu/mi-y-tom-cang-bien-xanh.jpg',
  },
  {
    name: 'Mì Ý Sốt Kem Béo',
    category: 'Pasta',
    description: 'Mì Ý Carbonara sốt kem tươi béo ngậy cùng thịt xông khói giòn và phô mai Parmesan.',
    price: 89000,
    imageUrl: '/images/menu/mi-y-sot-kem-beo.jpg',
  },
  {
    name: 'Mì Ý Bò Bằm',
    category: 'Pasta',
    description: 'Sốt Bolognese hầm chậm từ thịt bò Mỹ bằm, cà chua chín mọng và lá húng tây Ý.',
    price: 89000,
    imageUrl: '/images/menu/mi-y-bo-bam.jpg',
  },

  // ===================== STEAK & MAIN COURSE (10) =====================
  {
    name: 'Beef Wellington Premium - Bánh Ngàn Lớp Bọc Bò Nướng Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Tuyệt phẩm thăn nội bò thượng hạng bọc nấm Duxelles, thịt muối Parma và lớp vỏ ngàn lớp nướng vàng giòn. Yêu cầu đặt trước tối thiểu 4 giờ.',
    price: 449000,
    requiresAdvanceOrderHours: 4,
    badge: 'Đặt trước tối thiểu 4 giờ',
    imageUrl: '/images/menu/beef-wellington-premium.jpg',
  },
  {
    name: 'Steak Kobe x Khoai Tây Nghiền Vị Wasabi',
    category: 'Steak & Main Course',
    description: 'Thịt bò Kobe vân mỡ cẩm thạch mềm tan, áp chảo hoàn hảo dùng kèm khoai tây nghiền vị Wasabi độc đáo.',
    price: 199000,
    imageUrl: '/images/menu/steak-kobe-khoai-tay-wasabi.jpg',
  },
  {
    name: 'Steak Lõi Vai Bò Mỹ x Rau Củ Xào Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Lõi vai bò Mỹ (Top Blade) nướng chuẩn độ chín, mọng nước, phục vụ cùng rau củ xào bơ thảo mộc.',
    price: 169000,
    imageUrl: '/images/menu/steak-loi-vai-bo-my.jpg',
  },
  {
    name: 'Sườn Heo Non Mỹ Nướng Rục x Khoai Tây Múi Cau Vị Phô Mai - 2 pax',
    category: 'Steak & Main Course',
    description: 'Sườn heo non Mỹ ướp sốt BBQ đặc biệt nướng chậm rục xương cho 2 người, kèm khoai tây múi cau phô mai.',
    price: 199000,
    imageUrl: '/images/menu/suon-heo-non-my-nuong-ruc.jpg',
  },
  {
    name: 'What The Steak Bò Kobe x Phô Mai Bắp Bỏ Lò',
    category: 'Steak & Main Course',
    description: 'Steak bò Kobe thượng hạng phục vụ trên chảo gang nóng cùng phô mai bắp bỏ lò kéo sợi béo ngậy.',
    price: 289000,
    imageUrl: '/images/menu/what-the-steak-bo-kobe.jpg',
  },
  {
    name: 'Cheddar Steak x Sốt Phô Mai Chảy',
    category: 'Steak & Main Course',
    description: 'Steak bò mềm ngọt phủ thác sốt phô mai Cheddar nóng chảy thơm béo khó cưỡng.',
    price: 199000,
    imageUrl: '/images/menu/cheddar-steak-sot-pho-mai.jpg',
  },
  {
    name: 'What The Steak Bò Mỹ x Phô Mai Bắp Bỏ Lò',
    category: 'Steak & Main Course',
    description: 'Steak bò Mỹ chuẩn vị KingBeef kết hợp chảo phô mai bắp bỏ lò thơm lừng hấp dẫn.',
    price: 239000,
    imageUrl: '/images/menu/what-the-steak-bo-my.jpg',
  },
  {
    name: 'Hải Sản Đút Lò Sốt Phô Mai Bất Bại',
    category: 'Steak & Main Course',
    description: 'Tôm, mực, sò điệp tươi đút lò cùng sốt kem phô mai vàng ruộm béo ngậy.',
    price: 159000,
    imageUrl: '/images/menu/hai-san-dut-lo-sot-pho-mai.jpg',
  },
  {
    name: 'Cá Hồi Đút Lò Sốt Teriyaki x Rau Củ Xào Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Phi lê cá hồi Na Uy đút lò giữ trọn độ ẩm, áo sốt Teriyaki đậm đà kèm rau củ thảo mộc.',
    price: 179000,
    imageUrl: '/images/menu/ca-hoi-dut-lo-sot-teriyaki.jpg',
  },
  {
    name: 'Cá Hồi Đút Lò Sốt Kem Chanh Dây Lá Húng x Khoai Tây Nghiền Vị Wasabi',
    category: 'Steak & Main Course',
    description: 'Cá hồi đút lò mềm mịn hòa quyện sốt kem chanh dây lá húng thơm nồng và khoai tây nghiền Wasabi.',
    price: 189000,
    imageUrl: '/images/menu/ca-hoi-dut-lo-sot-chanh-day.jpg',
  },

  // ===================== DRINK & DESSERT (9) =====================
  {
    name: 'Soda Trái Cây',
    category: 'Drink & Dessert',
    description: 'Soda tươi mát pha cùng siro trái cây tự nhiên và lá bạc hà sảng khoái.',
    price: 89000,
    imageUrl: '/images/menu/soda-trai-cay.jpg',
  },
  {
    name: 'Nước Ngọt Lon - Coca, Sprite, Coca Zero',
    category: 'Drink & Dessert',
    description: 'Phục vụ ướp lạnh kèm đá viên và lát chanh tươi (tùy chọn Coca, Sprite hoặc Coca Zero).',
    price: 85000,
    imageUrl: '/images/menu/nuoc-ngot-lon.jpg',
  },
  {
    name: 'Nước Suối',
    category: 'Drink & Dessert',
    description: 'Nước khoáng tinh khiết ướp lạnh phục vụ tại bàn.',
    price: 28000,
    imageUrl: '/images/menu/nuoc-suoi.jpg',
  },
  {
    name: 'Cocktail Kingchill',
    category: 'Drink & Dessert',
    description: 'Cocktail đặc trưng của KingBeef cân bằng giữa vị rượu nền êm dịu và hương trái cây quyến rũ.',
    price: 75000,
    imageUrl: '/images/menu/cocktail-kingchill.jpg',
  },
  {
    name: 'Mocktail Kingfresh',
    category: 'Drink & Dessert',
    description: 'Thức uống không cồn tươi mát từ cam, chanh dây và thảo mộc.',
    price: 59000,
    imageUrl: '/images/menu/mocktail-kingfresh.jpg',
  },
  {
    name: 'Mocktail Ocean Blue',
    category: 'Drink & Dessert',
    description: 'Sắc xanh đại dương ấn tượng với hương cam Curacao không cồn và vị chua ngọt dịu nhẹ.',
    price: 59000,
    imageUrl: '/images/menu/mocktail-ocean-blue.jpg',
  },
  {
    name: 'Couple Drink: Fresh Love - Set 2 Người',
    category: 'Drink & Dessert',
    description: 'Bộ đôi thức uống lãng mạn thiết kế riêng cho các cặp đôi tại KingBeef.',
    price: 109000,
    imageUrl: '/images/menu/couple-drink-fresh-love.jpg',
  },
  {
    name: 'Kem Trái Cây - 1 Viên',
    category: 'Drink & Dessert',
    description: 'Kem Gelato mát lạnh vị trái cây tự nhiên, lựa chọn hoàn hảo kết thúc bữa tối.',
    price: 15000,
    imageUrl: '/images/menu/kem-trai-cay.jpg',
  },
  {
    name: 'Panna Cotta Trái Tim',
    category: 'Drink & Dessert',
    description: 'Panna Cotta mềm mịn tạo hình trái tim ngọt ngào phủ sốt dâu rừng.',
    price: 28000,
    imageUrl: '/images/menu/panna-cotta-trai-tim.jpg',
  },

  // ===================== COUPLE SET (2 PAX) (8) =====================
  {
    name: 'Sweetie Set - Miễn phí trang trí tiệc',
    category: 'Couple Set',
    description: 'Set tiệc lãng mạn dành cho 2 người gồm khai vị, 2 món chính và tráng miệng. Đặc biệt: Miễn phí trang trí bàn tiệc nến & hoa.',
    price: 479000,
    badge: 'Miễn phí trang trí tiệc',
    imageUrl: '/images/menu/sweetie-set.jpg',
  },
  {
    name: 'Love Set 1',
    category: 'Couple Set',
    description: 'Set ẩm thực Âu tinh tế cho 2 người kết hợp Salad, Pasta và Steak thượng hạng.',
    price: 519000,
    imageUrl: '/images/menu/love-set-1.jpg',
  },
  {
    name: 'Love Set 3',
    category: 'Couple Set',
    description: 'Trải nghiệm bữa tối lãng mạn cho 2 khách với món khai vị đặc sắc và cặp Steak chuẩn vị.',
    price: 529000,
    imageUrl: '/images/menu/love-set-3.jpg',
  },
  {
    name: 'Love Set 2',
    category: 'Couple Set',
    description: 'Set cao cấp cho 2 người với Soup, Salad, Steak bò Mỹ và món tráng miệng ngọt ngào.',
    price: 559000,
    imageUrl: '/images/menu/love-set-2.jpg',
  },
  {
    name: 'King Ocean',
    category: 'Couple Set',
    description: 'Bữa tiệc đại dương & đất liền (Surf & Turf) cho 2 người kết hợp Hải sản đút lò, Cá hồi và Steak.',
    price: 635000,
    imageUrl: '/images/menu/king-ocean.jpg',
  },
  {
    name: 'Kinglove Set 1',
    category: 'Couple Set',
    description: 'Set tiệc đặc biệt 2 người với bò Kobe, Mì Ý cao cấp, khai vị và Panna Cotta Trái Tim.',
    price: 639000,
    imageUrl: '/images/menu/kinglove-set-1.jpg',
  },
  {
    name: 'Kinglove Set 2',
    category: 'Couple Set',
    description: 'Set hoàng gia cho 2 người kết hợp What The Steak phô mai bắp bỏ lò, Salad Burrata và đồ uống.',
    price: 639000,
    imageUrl: '/images/menu/kinglove-set-2.jpg',
  },
  {
    name: 'King & Queen - Gồm Beef Wellington Premium',
    category: 'Couple Set',
    description: 'Đỉnh cao ẩm thực hẹn hò dành cho 2 người với tâm điểm là Beef Wellington Premium nướng thủ công. Yêu cầu đặt trước tối thiểu 4 giờ.',
    price: 779000,
    requiresAdvanceOrderHours: 4,
    badge: 'Đặt trước tối thiểu 4 giờ',
    imageUrl: '/images/menu/king-and-queen-set.jpg',
  },
];

function formatDateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  console.log('--- Bat dau nap du lieu (seed) cho KingBeef ---');

  await prisma.activityLog.deleteMany();
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 1. Tao 2 chi nhanh voi dia chi & hotline cap nhat
  const tanBinh = await prisma.branch.create({
    data: {
      name: 'Tân Bình',
      address: '120 Trương Công Định, Quận Tân Bình, TP.HCM',
      phone: '0562 275 375',
    },
  });

  const goVap = await prisma.branch.create({
    data: {
      name: 'Gò Vấp',
      address: '495 Phan Văn Trị, Quận Gò Vấp, TP.HCM',
      phone: '0562 275 375',
    },
  });

  // 2. Tao 7 sanh
  const hallClassic = await prisma.hall.create({
    data: {
      branchId: tanBinh.id,
      name: 'Sảnh Classic',
      type: 'indoor',
      description: 'Không gian cổ điển châu Âu với ánh đèn trầm ấm sang trọng, phù hợp tiệc gia đình và tiếp khách.',
    },
  });

  const hallGallery = await prisma.hall.create({
    data: {
      branchId: tanBinh.id,
      name: 'Sảnh Gallery',
      type: 'indoor',
      description: 'Không gian triển lãm nghệ thuật đương đại rộng rãi với 12 bàn sang trọng.',
    },
  });

  const hallTrain = await prisma.hall.create({
    data: {
      branchId: tanBinh.id,
      name: 'Sảnh Train to Love',
      type: 'indoor',
      description: 'Lấy cảm hứng từ chuyến tàu đêm châu Âu đầy lãng mạn dành cho các cặp đôi.',
    },
  });

  const hallSweet = await prisma.hall.create({
    data: {
      branchId: goVap.id,
      name: 'Sảnh Sweet',
      type: 'indoor',
      description: 'Không gian ngọt ngào, ấm cúng với ánh nến lung linh cho những buổi hẹn hò đáng nhớ.',
    },
  });

  const hallLove = await prisma.hall.create({
    data: {
      branchId: goVap.id,
      name: 'Sảnh Love',
      type: 'indoor',
      description: 'Khu vực riêng tư ấm áp với 6 bàn tinh tế đánh số từ 13 đến 18.',
    },
  });

  const hallVip = await prisma.hall.create({
    data: {
      branchId: goVap.id,
      name: 'Sảnh VIP',
      type: 'vip',
      description: 'Khu vực phòng và vách ngăn riêng tư đẳng cấp dành cho tiệc doanh nhân và kỷ niệm đặc biệt.',
    },
  });

  const hallMay = await prisma.hall.create({
    data: {
      branchId: goVap.id,
      name: 'Sảnh Mây',
      type: 'outdoor',
      description: 'Không gian ngoài trời thoáng đãng dưới bầu trời đêm với đèn dây ấm áp.',
    },
  });

  // 3. Tao 62 ban theo dung quy tac danh so
  const allTablesData = [
    ...buildGridTables(hallClassic.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5, 3.2, 3.6, [2, 4, 4, 4, 6]),
    ...buildGridTables(hallGallery.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4, 3.4, 3.2, [4, 4, 2, 6]),
    ...buildGridTables(hallTrain.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2, 5.2, 2.7, [2, 2, 4, 2, 4]),
    ...buildGridTables(hallSweet.id, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], 5, 3.2, 3.6, [2, 2, 4, 4, 4]),
    ...buildGridTables(hallLove.id, [13, 14, 15, 16, 17, 18], 3, 3.6, 3.8, [2, 2, 4]),
    ...buildGridTables(hallVip.id, [1, 2, 3, 4, 5, 6, 7, 8], 4, 4.2, 4.4, [6, 8, 6, 8]),
    ...buildGridTables(hallMay.id, [1, 2, 3, 4, 5, 6], 3, 4.0, 4.0, [2, 4, 4]),
  ];

  const sampleMaintIdx = allTablesData.findIndex(
    (t) => t.hallId === hallGallery.id && t.tableNumber === 12
  );
  if (sampleMaintIdx !== -1) {
    allTablesData[sampleMaintIdx].status = 'maintenance';
  }

  for (const tableData of allTablesData) {
    await prisma.table.create({ data: tableData });
  }

  // 4. Tao 52 mon an
  const createdMenu = [];
  for (const item of MENU_ITEMS) {
    const created = await prisma.menuItem.create({
      data: {
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl || null,
        badge: item.badge || null,
        stockQuantity: 50,
        isAvailable: true,
        requiresAdvanceOrderHours: item.requiresAdvanceOrderHours || 0,
      },
    });
    createdMenu.push(created);
  }

  // 5. Tao 3 tai khoan phan quyen + 2 tai khoan khach hang mau
  const [adminHash, cashierHash, staffHash, customerHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Cashier@123', 10),
    bcrypt.hash('Staff@123', 10),
    bcrypt.hash('Customer@123', 10),
  ]);

  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Quản Trị Viên KingBeef',
      email: 'admin@kingbeef.vn',
      phone: '0562 275 375',
      passwordHash: adminHash,
      role: 'admin',
      branchId: null,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      fullName: 'Thu Ngân Minh Thư',
      email: 'cashier@kingbeef.vn',
      phone: '0909000002',
      passwordHash: cashierHash,
      role: 'cashier',
      branchId: tanBinh.id,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      fullName: 'Phục Vụ Hoàng Nam',
      email: 'staff@kingbeef.vn',
      phone: '0909000003',
      passwordHash: staffHash,
      role: 'staff',
      branchId: goVap.id,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Minh Anh',
      email: 'customer@kingbeef.vn',
      phone: '0912345678',
      passwordHash: customerHash,
      role: 'customer',
      branchId: null,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      fullName: 'Trần Quốc Bảo',
      email: 'quocbao@example.com',
      phone: '0987654321',
      passwordHash: customerHash,
      role: 'customer',
      branchId: null,
    },
  });

  // 6. Tao don dat ban mau (bao gom ca 1 don Guest Booking khach vang lai)
  const tablesClassic = await prisma.table.findMany({ where: { hallId: hallClassic.id } });
  const tablesTrain = await prisma.table.findMany({ where: { hallId: hallTrain.id } });
  const tablesSweet = await prisma.table.findMany({ where: { hallId: hallSweet.id } });
  const tablesVip = await prisma.table.findMany({ where: { hallId: hallVip.id } });
  const tablesMay = await prisma.table.findMany({ where: { hallId: hallMay.id } });

  const sweetieSet = createdMenu.find((m) => m.name.startsWith('Sweetie Set'));
  const kobeSteak = createdMenu.find((m) => m.name.startsWith('Steak Kobe'));
  const kingQueen = createdMenu.find((m) => m.name.startsWith('King & Queen'));
  const pastaCua = createdMenu.find((m) => m.name === 'Mì Ý Cua Cà Mau');
  const burrata = createdMenu.find((m) => m.name.startsWith('Salad Burrata'));

  const sampleBookings = [
    {
      bookingCode: 'KB-TB-DEMO01',
      userId: customer1.id,
      guestName: customer1.fullName,
      guestPhone: customer1.phone,
      guestEmail: customer1.email,
      branchId: tanBinh.id,
      hallId: hallClassic.id,
      tableId: tablesClassic[0].id,
      reservationDate: formatDateOffset(-2),
      startTime: '18:00',
      endTime: '20:00',
      guestCount: 2,
      hasWinePromo: true,
      totalAmount: sweetieSet.price + 199000,
      depositAmount: Math.round((sweetieSet.price + 199000) * 0.3),
      depositStatus: 'paid',
      status: 'completed',
      specialRequest: 'Trang trí kỷ niệm 2 năm ngày yêu nhau',
      items: [{ menuItemId: sweetieSet.id, quantity: 1, unitPrice: sweetieSet.price }],
    },
    {
      bookingCode: 'KB-GV-DEMO02',
      userId: customer2.id,
      guestName: customer2.fullName,
      guestPhone: customer2.phone,
      guestEmail: customer2.email,
      branchId: goVap.id,
      hallId: hallVip.id,
      tableId: tablesVip[0].id,
      reservationDate: formatDateOffset(-1),
      startTime: '19:00',
      endTime: '21:00',
      guestCount: 4,
      hasWinePromo: true,
      totalAmount: kingQueen.price + burrata.price + 199000,
      depositAmount: Math.round((kingQueen.price + burrata.price + 199000) * 0.3),
      depositStatus: 'paid',
      status: 'completed',
      specialRequest: 'Phòng yên tĩnh tiếp đối tác',
      items: [
        { menuItemId: kingQueen.id, quantity: 1, unitPrice: kingQueen.price },
        { menuItemId: burrata.id, quantity: 1, unitPrice: burrata.price },
      ],
    },
    {
      bookingCode: 'KB-TB-DEMO03',
      userId: customer1.id,
      guestName: customer1.fullName,
      guestPhone: customer1.phone,
      guestEmail: customer1.email,
      branchId: tanBinh.id,
      hallId: hallTrain.id,
      tableId: tablesTrain[1].id,
      reservationDate: formatDateOffset(0),
      startTime: '19:00',
      endTime: '21:00',
      guestCount: 2,
      hasWinePromo: false,
      totalAmount: kobeSteak.price * 2 + pastaCua.price,
      depositAmount: 200000,
      depositStatus: 'paid',
      status: 'confirmed',
      specialRequest: 'Steak chín Medium Rare',
      items: [
        { menuItemId: kobeSteak.id, quantity: 2, unitPrice: kobeSteak.price },
        { menuItemId: pastaCua.id, quantity: 1, unitPrice: pastaCua.price },
      ],
    },
    {
      bookingCode: 'KB-GV-DEMO04',
      userId: null, // Khach vang lai (Guest Booking)
      guestName: 'Lê Thanh Trúc (Khách vãng lai)',
      guestPhone: '0938112233',
      guestEmail: 'thanhtruc@gmail.com',
      branchId: goVap.id,
      hallId: hallMay.id,
      tableId: tablesMay[0].id,
      reservationDate: formatDateOffset(0),
      startTime: '20:00',
      endTime: '22:00',
      guestCount: 2,
      hasWinePromo: true,
      totalAmount: sweetieSet.price + 199000,
      depositAmount: Math.round((sweetieSet.price + 199000) * 0.3),
      depositStatus: 'waiting_confirm',
      status: 'waiting_deposit_confirm',
      specialRequest: 'Bàn ngắm trời tối, trang trí sinh nhật nhẹ nhàng',
      items: [{ menuItemId: sweetieSet.id, quantity: 1, unitPrice: sweetieSet.price }],
    },
    {
      bookingCode: 'KB-GV-DEMO05',
      userId: customer1.id,
      guestName: customer1.fullName,
      guestPhone: customer1.phone,
      guestEmail: customer1.email,
      branchId: goVap.id,
      hallId: hallSweet.id,
      tableId: tablesSweet[2].id,
      reservationDate: formatDateOffset(1),
      startTime: '18:30',
      endTime: '20:30',
      guestCount: 4,
      hasWinePromo: false,
      totalAmount: 0,
      depositAmount: 200000,
      depositStatus: 'paid',
      status: 'confirmed',
      specialRequest: 'Gọi món trực tiếp tại nhà hàng',
      items: [],
    },
  ];

  for (const booking of sampleBookings) {
    const { items, ...bookingData } = booking;
    await prisma.reservation.create({
      data: {
        ...bookingData,
        items: { create: items },
      },
    });
  }

  // 7. Tao du lieu ActivityLog mau cho trang Lich su thao tac Admin
  await prisma.activityLog.createMany({
    data: [
      {
        userId: cashierUser.id,
        branchId: tanBinh.id,
        action: 'CONFIRM_DEPOSIT',
        targetType: 'Reservation',
        targetId: 'KB-TB-DEMO03',
        details: 'Duyệt đặt cọc QR 200.000đ cho đơn KB-TB-DEMO03 (Sảnh Train to Love - Bàn 2)',
      },
      {
        userId: staffUser.id,
        branchId: goVap.id,
        action: 'CHECK_IN',
        targetType: 'Reservation',
        targetId: 'KB-GV-DEMO02',
        details: 'Check-in khách Trần Quốc Bảo tại đơn KB-GV-DEMO02 (Sảnh VIP - Bàn 1)',
      },
      {
        userId: cashierUser.id,
        branchId: goVap.id,
        action: 'COMPLETE_BOOKING',
        targetType: 'Reservation',
        targetId: 'KB-GV-DEMO02',
        details: 'Hoàn tất thanh toán đơn KB-GV-DEMO02 (Tổng món: 1.217.000đ)',
      },
      {
        userId: adminUser.id,
        branchId: tanBinh.id,
        action: 'UPDATE_TABLE',
        targetType: 'Table',
        targetId: '12',
        details: 'Chuyển Bàn số 12 (Sảnh Gallery - Tân Bình) sang trạng thái bảo trì (maintenance)',
      },
      {
        userId: staffUser.id,
        branchId: goVap.id,
        action: 'UPDATE_STOCK',
        targetType: 'MenuItem',
        targetId: String(kobeSteak.id),
        details: 'Kiểm tra & đồng bộ tồn kho món "Steak Kobe x Khoai Tây Nghiền Vị Wasabi" (50 phần)',
      },
    ],
  });

  console.log('Seed thanh cong!');
  console.log(`- 2 chi nhanh: ${tanBinh.name} (120 Trương Công Định), ${goVap.name} (495 Phan Văn Trị) | Hotline: 0562 275 375`);
  console.log(`- 7 sanh, tong cong ${allTablesData.length} ban`);
  console.log(`- ${createdMenu.length} mon an (imageUrl -> /images/menu/<slug>.jpg)`);
  console.log('- 5 ActivityLog mau cho Admin');
}

main()
  .catch((e) => {
    console.error('Loi khi chay seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
