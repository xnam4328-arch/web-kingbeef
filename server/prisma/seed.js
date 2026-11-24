const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper sinh tọa độ 3D đẹp mắt cho các sảnh
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

// Danh sách thực đơn đầy đủ 52 món theo đúng yêu cầu (giá VNĐ, chưa gồm VAT)
const MENU_ITEMS = [
  // ===================== APPETIZERS (8) =====================
  {
    name: 'Thịt Hun Khói Cuộn Rau Củ Sốt Kimchi',
    category: 'Appetizers',
    description: 'Ba rọi hun khói thơm lừng cuộn rau củ tươi giòn, dùng kèm sốt Kimchi đậm đà kích thích vị giác.',
    price: 79000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sò Điệp Áp Chảo Sốt Trái Cây',
    category: 'Appetizers',
    description: 'Sò điệp Nhật áp chảo bơ vàng óng, hòa quyện cùng sốt trái cây nhiệt đới thanh mát.',
    price: 169000,
    imageUrl: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Lườn Ngỗng Xông Khói Sốt Chanh Dây',
    category: 'Appetizers',
    description: 'Lườn ngỗng hun khói mềm mọng cắt lát mỏng, phủ sốt chanh dây chua ngọt tinh tế kiểu Pháp.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sườn Sốt Phô Mai Cay',
    category: 'Appetizers',
    description: 'Sườn non nướng mềm phủ lớp sốt phô mai béo ngậy hòa cùng vị cay nhẹ đầy cuốn hút.',
    price: 79000,
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cá Hồi Canape',
    category: 'Appetizers',
    description: 'Bánh mì giòn kiểu Âu phủ kem phô mai thảo mộc và cá hồi Na Uy tươi béo ngậy.',
    price: 59000,
    imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bánh Mì Nướng Bơ Thảo Mộc',
    category: 'Appetizers',
    description: 'Bánh mì baguette nướng giòn rụm quyện bơ tỏi và lá hương thảo thơm nồng.',
    price: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Khoai Môn Chiên Giòn Lắc Phô Mai',
    category: 'Appetizers',
    description: 'Khoai môn cắt sợi chiên vàng giòn tan, phủ bột phô mai mặn ngọt thơm béo.',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Khoai Tây Chiên Sốt Tỏi',
    category: 'Appetizers',
    description: 'Khoai tây chiên giòn kiểu Bỉ xóc bơ tỏi thơm lừng kèm sốt chấm đặc chế.',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== SOUP (4) =====================
  {
    name: 'Soup Gà Cuộn Vị Tomyum',
    category: 'Soup',
    description: 'Súp kem nóng hổi kết hợp thịt gà cuộn mềm thơm và hương vị Tomyum chua cay tinh tế.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Soup Kem Bí Đỏ',
    category: 'Soup',
    description: 'Bí đỏ Nhật ninh nhừ đánh mịn cùng kem tươi béo nhẹ, dùng kèm bánh mì nướng giòn.',
    price: 79000,
    imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Soup Hải Sản Kiểu Anh',
    category: 'Soup',
    description: 'Súp Chowder truyền thống nấu từ hải sản tươi ngọt, kem tươi và thảo mộc Âu.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Soup Tôm Càng Kem Béo',
    category: 'Soup',
    description: 'Nước dùng tôm càng ninh chậm sóng sánh cùng kem tươi thượng hạng và thịt tôm săn chắc.',
    price: 95000,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== SALAD (7) =====================
  {
    name: 'Salad Trái Cây Theo Mùa Sốt Sữa Chua Hy Lạp',
    category: 'Salad',
    description: 'Rau mầm hữu cơ và trái cây tươi theo mùa trộn sốt sữa chua Hy Lạp thanh mát.',
    price: 79000,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Burrata Nhà Làm - Trái Cây Theo Mùa & Sốt Rau Thơm Châu Á',
    category: 'Salad',
    description: 'Phô mai Burrata tươi béo mịn thủ công kết hợp trái cây chín mọng và sốt rau thơm độc quyền KingBeef.',
    price: 239000,
    imageUrl: 'https://images.unsplash.com/photo-1608032077018-c9aad9565d29?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Lườn Cá Hồi Chiên Giòn Sốt Chanh Dây',
    category: 'Salad',
    description: 'Lườn cá hồi chiên giòn béo ngậy hòa quyện rau xanh giòn tươi và sốt chanh dây thơm lừng.',
    price: 69000,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Cá Ngừ Ngâm Dầu Sốt Kem Béo',
    category: 'Salad',
    description: 'Cá ngừ đại dương ngâm dầu ô liu trộn cùng rau xà lách tươi và sốt kem béo kiểu Âu.',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Hải Sản Hương Khói',
    category: 'Salad',
    description: 'Hải sản tươi áp chảo hương khói nhẹ kết hợp rau củ giòn và sốt giấm balsamic.',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Gà Nướng Thảo Mộc',
    category: 'Salad',
    description: 'Ức gà ướp thảo mộc nướng mềm mọng trên nền rau xanh tươi mát và sốt mè rang.',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Salad Rau Xanh Bò Cháy Cạnh',
    category: 'Salad',
    description: 'Thịt bò Mỹ áp chảo cháy cạnh thơm lừng dùng kèm rau xanh hữu cơ và sốt tiêu đen.',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== PASTA (6) =====================
  {
    name: 'Mì Ý Cua Cà Mau',
    category: 'Pasta',
    description: 'Sợi mì Ý al dente hòa quyện thịt cua Cà Mau chắc ngọt và sốt gạch cua béo thơm đặc trưng.',
    price: 129000,
    imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mì Ý Cá Hồi Sốt Kem Thì Là',
    category: 'Pasta',
    description: 'Cá hồi Na Uy áp chảo mềm béo dùng kèm mì Ý sốt kem tươi thơm dịu hương thì là.',
    price: 129000,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mì Ý Sốt Kem Cà Chua Hải Sản',
    category: 'Pasta',
    description: 'Hải sản tươi ngọt xào tỏi hòa quyện trong sốt hồng (kem cà chua) đậm vị chuẩn Ý.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mì Ý Tôm Càng Biển Xanh',
    category: 'Pasta',
    description: 'Tôm càng nướng bơ tỏi phục vụ cùng mì Ý sốt hải sản thanh ngọt đậm đà.',
    price: 129000,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mì Ý Sốt Kem Béo',
    category: 'Pasta',
    description: 'Mì Ý Carbonara sốt kem tươi béo ngậy cùng thịt xông khói giòn và phô mai Parmesan.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mì Ý Bò Bằm',
    category: 'Pasta',
    description: 'Sốt Bolognese hầm chậm từ thịt bò Mỹ bằm, cà chua chín mọng và lá húng tây Ý.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== STEAK & MAIN COURSE (10) =====================
  {
    name: 'Beef Wellington Premium - Bánh Ngàn Lớp Bọc Bò Nướng Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Tuyệt phẩm thăn nội bò thượng hạng bọc nấm Duxelles, thịt muối Parma và lớp vỏ ngàn lớp nướng vàng giòn. Yêu cầu đặt trước tối thiểu 4 giờ.',
    price: 449000,
    requiresAdvanceOrderHours: 4,
    badge: 'Đặt trước tối thiểu 4 giờ',
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Steak Kobe x Khoai Tây Nghiền Vị Wasabi',
    category: 'Steak & Main Course',
    description: 'Thịt bò Kobe vân mỡ cẩm thạch mềm tan, áp chảo hoàn hảo dùng kèm khoai tây nghiền vị Wasabi độc đáo.',
    price: 199000,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Steak Lõi Vai Bò Mỹ x Rau Củ Xào Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Lõi vai bò Mỹ (Top Blade) nướng chuẩn độ chín, mọng nước, phục vụ cùng rau củ xào bơ thảo mộc.',
    price: 169000,
    imageUrl: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sườn Heo Non Mỹ Nướng Rục x Khoai Tây Múi Cau Vị Phô Mai - 2 pax',
    category: 'Steak & Main Course',
    description: 'Sườn heo non Mỹ ướp sốt BBQ đặc biệt nướng chậm rục xương cho 2 người, kèm khoai tây múi cau phô mai.',
    price: 199000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'What The Steak Bò Kobe x Phô Mai Bắp Bỏ Lò',
    category: 'Steak & Main Course',
    description: 'Steak bò Kobe thượng hạng phục vụ trên chảo gang nóng cùng phô mai bắp bỏ lò kéo sợi béo ngậy.',
    price: 289000,
    imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cheddar Steak x Sốt Phô Mai Chảy',
    category: 'Steak & Main Course',
    description: 'Steak bò mềm ngọt phủ thác sốt phô mai Cheddar nóng chảy thơm béo khó cưỡng.',
    price: 199000,
    imageUrl: 'https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'What The Steak Bò Mỹ x Phô Mai Bắp Bỏ Lò',
    category: 'Steak & Main Course',
    description: 'Steak bò Mỹ chuẩn vị KingBeef kết hợp chảo phô mai bắp bỏ lò thơm lừng hấp dẫn.',
    price: 239000,
    imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hải Sản Đút Lò Sốt Phô Mai Bất Bại',
    category: 'Steak & Main Course',
    description: 'Tôm, mực, sò điệp tươi đút lò cùng sốt kem phô mai vàng ruộm béo ngậy.',
    price: 159000,
    imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cá Hồi Đút Lò Sốt Teriyaki x Rau Củ Xào Thảo Mộc',
    category: 'Steak & Main Course',
    description: 'Phi lê cá hồi Na Uy đút lò giữ trọn độ ẩm, áo sốt Teriyaki đậm đà kèm rau củ thảo mộc.',
    price: 179000,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cá Hồi Đút Lò Sốt Kem Chanh Dây Lá Húng x Khoai Tây Nghiền Vị Wasabi',
    category: 'Steak & Main Course',
    description: 'Cá hồi đút lò mềm mịn hòa quyện sốt kem chanh dây lá húng thơm nồng và khoai tây nghiền Wasabi.',
    price: 189000,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== DRINK & DESSERT (9) =====================
  {
    name: 'Soda Trái Cây',
    category: 'Drink & Dessert',
    description: 'Soda tươi mát pha cùng siro trái cây tự nhiên và lá bạc hà sảng khoái.',
    price: 89000,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Nước Ngọt Lon - Coca, Sprite, Coca Zero',
    category: 'Drink & Dessert',
    description: 'Phục vụ ướp lạnh kèm đá viên và lát chanh tươi (tùy chọn Coca, Sprite hoặc Coca Zero).',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Nước Suối',
    category: 'Drink & Dessert',
    description: 'Nước khoáng tinh khiết ướp lạnh phục vụ tại bàn.',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cocktail Kingchill',
    category: 'Drink & Dessert',
    description: 'Cocktail đặc trưng của KingBeef cân bằng giữa vị rượu nền êm dịu và hương trái cây quyến rũ.',
    price: 75000,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mocktail Kingfresh',
    category: 'Drink & Dessert',
    description: 'Thức uống không cồn tươi mát từ cam, chanh dây và thảo mộc.',
    price: 59000,
    imageUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mocktail Ocean Blue',
    category: 'Drink & Dessert',
    description: 'Sắc xanh đại dương ấn tượng với hương cam Curacao không cồn và vị chua ngọt dịu nhẹ.',
    price: 59000,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Couple Drink: Fresh Love - Set 2 Người',
    category: 'Drink & Dessert',
    description: 'Bộ đôi thức uống lãng mạn thiết kế riêng cho các cặp đôi tại KingBeef.',
    price: 109000,
    imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kem Trái Cây - 1 Viên',
    category: 'Drink & Dessert',
    description: 'Kem Gelato mát lạnh vị trái cây tự nhiên, lựa chọn hoàn hảo kết thúc bữa tối.',
    price: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Panna Cotta Trái Tim',
    category: 'Drink & Dessert',
    description: 'Panna Cotta mềm mịn tạo hình trái tim ngọt ngào phủ sốt dâu rừng.',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  },

  // ===================== COUPLE SET (2 PAX) (8) =====================
  {
    name: 'Sweetie Set - Miễn phí trang trí tiệc',
    category: 'Couple Set',
    description: 'Set tiệc lãng mạn dành cho 2 người gồm khai vị, 2 món chính và tráng miệng. Đặc biệt: Miễn phí trang trí bàn tiệc nến & hoa.',
    price: 479000,
    badge: 'Miễn phí trang trí tiệc',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Love Set 1',
    category: 'Couple Set',
    description: 'Set ẩm thực Âu tinh tế cho 2 người kết hợp Salad, Pasta và Steak thượng hạng.',
    price: 519000,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Love Set 3',
    category: 'Couple Set',
    description: 'Trải nghiệm bữa tối lãng mạn cho 2 khách với món khai vị đặc sắc và cặp Steak chuẩn vị.',
    price: 529000,
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Love Set 2',
    category: 'Couple Set',
    description: 'Set cao cấp cho 2 người với Soup, Salad, Steak bò Mỹ và món tráng miệng ngọt ngào.',
    price: 559000,
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'King Ocean',
    category: 'Couple Set',
    description: 'Bữa tiệc đại dương & đất liền (Surf & Turf) cho 2 người kết hợp Hải sản đút lò, Cá hồi và Steak.',
    price: 635000,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kinglove Set 1',
    category: 'Couple Set',
    description: 'Set tiệc đặc biệt 2 người với bò Kobe, Mì Ý cao cấp, khai vị và Panna Cotta Trái Tim.',
    price: 639000,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kinglove Set 2',
    category: 'Couple Set',
    description: 'Set hoàng gia cho 2 người kết hợp What The Steak phô mai bắp bỏ lò, Salad Burrata và đồ uống.',
    price: 639000,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'King & Queen - Gồm Beef Wellington Premium',
    category: 'Couple Set',
    description: 'Đỉnh cao ẩm thực hẹn hò dành cho 2 người với tâm điểm là Beef Wellington Premium nướng thủ công. Yêu cầu đặt trước tối thiểu 4 giờ.',
    price: 779000,
    requiresAdvanceOrderHours: 4,
    badge: 'Đặt trước tối thiểu 4 giờ',
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
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

  // Xoa du lieu cu theo thu tu khoa ngoai de chay seed lai an toan (idempotent)
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 1. Tao 2 chi nhanh
  const tanBinh = await prisma.branch.create({
    data: {
      name: 'Tân Bình',
      address: '248 Cộng Hòa, Phường 12, Quận Tân Bình, TP. Hồ Chí Minh',
      phone: '028 3811 6688',
    },
  });

  const goVap = await prisma.branch.create({
    data: {
      name: 'Gò Vấp',
      address: '168 Phan Văn Trị, Phường 5, Quận Gò Vấp, TP. Hồ Chí Minh',
      phone: '028 3989 6688',
    },
  });

  // 2. Tao 7 sanh theo dung cau truc
  // Tan Binh (3 sanh)
  const hallClassic = await prisma.hall.create({
    data: {
      branchId: tanBinh.id,
      name: 'Sảnh Classic',
      type: 'indoor',
      description: 'Không gian cổ điển châu Âu với ánh đèn vàng đồng ấm áp, phù hợp tiệc gia đình và tiếp khách.',
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

  // Go Vap (4 sanh)
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
      description: 'Không gian ngoài trời thoáng đãng dưới bầu trời đêm với đèn dây vàng ấm áp.',
    },
  });

  // 3. Tao toan bo 62 ban theo dung quy tac danh so
  const allTablesData = [
    // Tan Binh - Classic: 1..10 (10 ban)
    ...buildGridTables(hallClassic.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5, 3.2, 3.6, [2, 4, 4, 4, 6]),
    // Tan Binh - Gallery: 1..12 (12 ban)
    ...buildGridTables(hallGallery.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4, 3.4, 3.2, [4, 4, 2, 6]),
    // Tan Binh - Train to Love: 1..10 (10 ban, 2 day doc toa tau)
    ...buildGridTables(hallTrain.id, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2, 5.2, 2.7, [2, 2, 4, 2, 4]),
    // Go Vap - Sweet: 10 ban, KHONG CO ban so 6 (1,2,3,4,5,7,8,9,10,11)
    ...buildGridTables(hallSweet.id, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], 5, 3.2, 3.6, [2, 2, 4, 4, 4]),
    // Go Vap - Love: 6 ban, bat dau tu ban so 13 (13..18)
    ...buildGridTables(hallLove.id, [13, 14, 15, 16, 17, 18], 3, 3.6, 3.8, [2, 2, 4]),
    // Go Vap - VIP: 1..8 (8 ban, vach ngan rieng)
    ...buildGridTables(hallVip.id, [1, 2, 3, 4, 5, 6, 7, 8], 4, 4.2, 4.4, [6, 8, 6, 8]),
    // Go Vap - May: 1..6 (6 ban, ngoai troi Outdoor)
    ...buildGridTables(hallMay.id, [1, 2, 3, 4, 5, 6], 3, 4.0, 4.0, [2, 4, 4]),
  ];

  // Dat 1 ban mau o trang thai maintenance de minh hoa tren so do 3D
  const sampleMaintIdx = allTablesData.findIndex(
    (t) => t.hallId === hallGallery.id && t.tableNumber === 12
  );
  if (sampleMaintIdx !== -1) {
    allTablesData[sampleMaintIdx].status = 'maintenance';
  }

  for (const tableData of allTablesData) {
    await prisma.table.create({ data: tableData });
  }

  // 4. Tao toan bo 52 mon an
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

  // 5. Tao 3 tai khoan phan quyen bat buoc + 2 tai khoan khach hang mau
  const [adminHash, cashierHash, staffHash, customerHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Cashier@123', 10),
    bcrypt.hash('Staff@123', 10),
    bcrypt.hash('Customer@123', 10),
  ]);

  await prisma.user.create({
    data: {
      fullName: 'Quản Trị Viên KingBeef',
      email: 'admin@kingbeef.vn',
      phone: '0909000001',
      passwordHash: adminHash,
      role: 'admin',
      branchId: null,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Thu Ngân Minh Thư',
      email: 'cashier@kingbeef.vn',
      phone: '0909000002',
      passwordHash: cashierHash,
      role: 'cashier',
      branchId: tanBinh.id,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Phục Vụ Hoàng Nam',
      email: 'staff@kingbeef.vn',
      phone: '0909000003',
      passwordHash: staffHash,
      role: 'staff',
      branchId: tanBinh.id,
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

  // 6. Tao mot so don dat ban mau de bieu do Dashboard & giao dien Admin co du lieu ngay lap tuc
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
      userId: customer2.id,
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

  console.log('Seed thanh cong!');
  console.log(`- 2 chi nhanh: ${tanBinh.name}, ${goVap.name}`);
  console.log(`- 7 sanh, tong cong ${allTablesData.length} ban (chuan quy tac danh so)`);
  console.log(`- ${createdMenu.length} mon an`);
  console.log('- Tai khoan mac dinh:');
  console.log('  + Admin   : admin@kingbeef.vn / Admin@123');
  console.log('  + Cashier : cashier@kingbeef.vn / Cashier@123');
  console.log('  + Staff   : staff@kingbeef.vn / Staff@123');
  console.log('  + Customer: customer@kingbeef.vn / Customer@123');
}

main()
  .catch((e) => {
    console.error('Loi khi chay seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
