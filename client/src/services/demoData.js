function buildGridTables(startId, hallId, numbers, cols, spacingX, spacingZ, capacities) {
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
      id: startId + idx,
      hallId,
      tableNumber,
      capacity,
      posX,
      posY: 0,
      posZ,
      status: hallId === 2 && tableNumber === 12 ? 'maintenance' : 'available',
    };
  });
}

function dateOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const RAW_MENU = [
  // Appetizers (8)
  ['Thịt Hun Khói Cuộn Rau Củ Sốt Kimchi', 'Appetizers', 79000, '/images/menu/thit-hun-khoi-cuon-rau-cu-sot-kimchi.jpg', 'Ba rọi hun khói thơm lừng cuộn rau củ tươi giòn, dùng kèm sốt Kimchi đậm đà kích thích vị giác.'],
  ['Sò Điệp Áp Chảo Sốt Trái Cây', 'Appetizers', 169000, '/images/menu/so-diep-ap-chao-sot-trai-cay.jpg', 'Sò điệp Nhật áp chảo bơ vàng óng, hòa quyện cùng sốt trái cây nhiệt đới thanh mát.'],
  ['Lườn Ngỗng Xông Khói Sốt Chanh Dây', 'Appetizers', 89000, '/images/menu/luon-ngong-xong-khoi-sot-chanh-day.jpg', 'Lườn ngỗng hun khói mềm mọng cắt lát mỏng, phủ sốt chanh dây chua ngọt tinh tế kiểu Pháp.'],
  ['Sườn Sốt Phô Mai Cay', 'Appetizers', 79000, '/images/menu/suon-sot-pho-mai-cay.jpg', 'Sườn non nướng mềm phủ lớp sốt phô mai béo ngậy hòa cùng vị cay nhẹ đầy cuốn hút.'],
  ['Cá Hồi Canape', 'Appetizers', 59000, '/images/menu/ca-hoi-canape.jpg', 'Bánh mì giòn kiểu Âu phủ kem phô mai thảo mộc và cá hồi Na Uy tươi béo ngậy.'],
  ['Bánh Mì Nướng Bơ Thảo Mộc', 'Appetizers', 29000, '/images/menu/banh-mi-nuong-bo-thao-moc.jpg', 'Bánh mì baguette nướng giòn rụm quyện bơ tỏi và lá hương thảo thơm nồng.'],
  ['Khoai Môn Chiên Giòn Lắc Phô Mai', 'Appetizers', 39000, '/images/menu/khoai-mon-chien-gion-lac-pho-mai.jpg', 'Khoai môn cắt sợi chiên vàng giòn tan, phủ bột phô mai mặn ngọt thơm béo.'],
  ['Khoai Tây Chiên Sốt Tỏi', 'Appetizers', 39000, '/images/menu/khoai-tay-chien-sot-toi.jpg', 'Khoai tây chiên giòn kiểu Bỉ xóc bơ tỏi thơm lừng kèm sốt chấm đặc chế.'],
  // Soup (4)
  ['Soup Gà Cuộn Vị Tomyum', 'Soup', 89000, '/images/menu/soup-ga-cuon-vi-tomyum.jpg', 'Súp kem nóng hổi kết hợp thịt gà cuộn mềm thơm và hương vị Tomyum chua cay tinh tế.'],
  ['Soup Kem Bí Đỏ', 'Soup', 79000, '/images/menu/soup-kem-bi-do.jpg', 'Bí đỏ Nhật ninh nhừ đánh mịn cùng kem tươi béo nhẹ, dùng kèm bánh mì nướng giòn.'],
  ['Soup Hải Sản Kiểu Anh', 'Soup', 89000, '/images/menu/soup-hai-san-kieu-anh.jpg', 'Súp Chowder truyền thống nấu từ hải sản tươi ngọt, kem tươi và thảo mộc Âu.'],
  ['Soup Tôm Càng Kem Béo', 'Soup', 95000, '/images/menu/soup-tom-cang-kem-beo.jpg', 'Nước dùng tôm càng ninh chậm sóng sánh cùng kem tươi thượng hạng và thịt tôm săn chắc.'],
  // Salad (7)
  ['Salad Trái Cây Theo Mùa Sốt Sữa Chua Hy Lạp', 'Salad', 79000, '/images/menu/salad-trai-cay-sua-chua-hy-lap.jpg', 'Rau mầm hữu cơ và trái cây tươi theo mùa trộn sốt sữa chua Hy Lạp thanh mát.'],
  ['Salad Burrata Nhà Làm - Trái Cây Theo Mùa & Sốt Rau Thơm Châu Á', 'Salad', 239000, '/images/menu/salad-burrata-nha-lam.jpg', 'Phô mai Burrata tươi béo mịn thủ công kết hợp trái cây chín mọng và sốt rau thơm độc quyền KingBeef.'],
  ['Salad Lườn Cá Hồi Chiên Giòn Sốt Chanh Dây', 'Salad', 69000, '/images/menu/salad-luon-ca-hoi-chien-gion.jpg', 'Lườn cá hồi chiên giòn béo ngậy hòa quyện rau xanh giòn tươi và sốt chanh dây thơm lừng.'],
  ['Salad Cá Ngừ Ngâm Dầu Sốt Kem Béo', 'Salad', 49000, '/images/menu/salad-ca-ngu-ngam-dau.jpg', 'Cá ngừ đại dương ngâm dầu ô liu trộn cùng rau xà lách tươi và sốt kem béo kiểu Âu.'],
  ['Salad Hải Sản Hương Khói', 'Salad', 49000, '/images/menu/salad-hai-san-huong-khoi.jpg', 'Hải sản tươi áp chảo hương khói nhẹ kết hợp rau củ giòn và sốt giấm balsamic.'],
  ['Salad Gà Nướng Thảo Mộc', 'Salad', 49000, '/images/menu/salad-ga-nuong-thao-moc.jpg', 'Ức gà ướp thảo mộc nướng mềm mọng trên nền rau xanh tươi mát và sốt mè rang.'],
  ['Salad Rau Xanh Bò Cháy Cạnh', 'Salad', 49000, '/images/menu/salad-rau-xanh-bo-chay-canh.jpg', 'Thịt bò Mỹ áp chảo cháy cạnh thơm lừng dùng kèm rau xanh hữu cơ và sốt tiêu đen.'],
  // Pasta (6)
  ['Mì Ý Cua Cà Mau', 'Pasta', 129000, '/images/menu/mi-y-cua-ca-mau.jpg', 'Sợi mì Ý al dente hòa quyện thịt cua Cà Mau chắc ngọt và sốt gạch cua béo thơm đặc trưng.'],
  ['Mì Ý Cá Hồi Sốt Kem Thì Là', 'Pasta', 129000, '/images/menu/mi-y-ca-hoi-sot-kem-thi-la.jpg', 'Cá hồi Na Uy áp chảo mềm béo dùng kèm mì Ý sốt kem tươi thơm dịu hương thì là.'],
  ['Mì Ý Sốt Kem Cà Chua Hải Sản', 'Pasta', 89000, '/images/menu/mi-y-sot-kem-ca-chua-hai-san.jpg', 'Hải sản tươi ngọt xào tỏi hòa quyện trong sốt hồng (kem cà chua) đậm vị chuẩn Ý.'],
  ['Mì Ý Tôm Càng Biển Xanh', 'Pasta', 129000, '/images/menu/mi-y-tom-cang-bien-xanh.jpg', 'Tôm càng nướng bơ tỏi phục vụ cùng mì Ý sốt hải sản thanh ngọt đậm đà.'],
  ['Mì Ý Sốt Kem Béo', 'Pasta', 89000, '/images/menu/mi-y-sot-kem-beo.jpg', 'Mì Ý Carbonara sốt kem tươi béo ngậy cùng thịt xông khói giòn và phô mai Parmesan.'],
  ['Mì Ý Bò Bằm', 'Pasta', 89000, '/images/menu/mi-y-bo-bam.jpg', 'Sốt Bolognese hầm chậm từ thịt bò Mỹ bằm, cà chua chín mọng và lá húng tây Ý.'],
  // Steak & Main Course (10)
  ['Beef Wellington Premium - Bánh Ngàn Lớp Bọc Bò Nướng Thảo Mộc', 'Steak & Main Course', 449000, '/images/menu/beef-wellington-premium.jpg', 'Tuyệt phẩm thăn nội bò thượng hạng bọc nấm Duxelles, thịt muối Parma và lớp vỏ ngàn lớp nướng vàng giòn. Yêu cầu đặt trước tối thiểu 4 giờ.', 4, 'Đặt trước tối thiểu 4 giờ'],
  ['Steak Kobe x Khoai Tây Nghiền Vị Wasabi', 'Steak & Main Course', 199000, '/images/menu/steak-kobe-khoai-tay-wasabi.jpg', 'Thịt bò Kobe vân mỡ cẩm thạch mềm tan, áp chảo hoàn hảo dùng kèm khoai tây nghiền vị Wasabi độc đáo.'],
  ['Steak Lõi Vai Bò Mỹ x Rau Củ Xào Thảo Mộc', 'Steak & Main Course', 169000, '/images/menu/steak-loi-vai-bo-my.jpg', 'Lõi vai bò Mỹ (Top Blade) nướng chuẩn độ chín, mọng nước, phục vụ cùng rau củ xào bơ thảo mộc.'],
  ['Sườn Heo Non Mỹ Nướng Rục x Khoai Tây Múi Cau Vị Phô Mai - 2 pax', 'Steak & Main Course', 199000, '/images/menu/suon-heo-non-my-nuong-ruc.jpg', 'Sườn heo non Mỹ ướp sốt BBQ đặc biệt nướng chậm rục xương cho 2 người, kèm khoai tây múi cau phô mai.'],
  ['What The Steak Bò Kobe x Phô Mai Bắp Bỏ Lò', 'Steak & Main Course', 289000, '/images/menu/what-the-steak-bo-kobe.jpg', 'Steak bò Kobe thượng hạng phục vụ trên chảo gang nóng cùng phô mai bắp bỏ lò kéo sợi béo ngậy.'],
  ['Cheddar Steak x Sốt Phô Mai Chảy', 'Steak & Main Course', 199000, '/images/menu/cheddar-steak-sot-pho-mai.jpg', 'Steak bò mềm ngọt phủ thác sốt phô mai Cheddar nóng chảy thơm béo khó cưỡng.'],
  ['What The Steak Bò Mỹ x Phô Mai Bắp Bỏ Lò', 'Steak & Main Course', 239000, '/images/menu/what-the-steak-bo-my.jpg', 'Steak bò Mỹ chuẩn vị KingBeef kết hợp chảo phô mai bắp bỏ lò thơm lừng hấp dẫn.'],
  ['Hải Sản Đút Lò Sốt Phô Mai Bất Bại', 'Steak & Main Course', 159000, '/images/menu/hai-san-dut-lo-sot-pho-mai.jpg', 'Tôm, mực, sò điệp tươi đút lò cùng sốt kem phô mai vàng ruộm béo ngậy.'],
  ['Cá Hồi Đút Lò Sốt Teriyaki x Rau Củ Xào Thảo Mộc', 'Steak & Main Course', 179000, '/images/menu/ca-hoi-dut-lo-sot-teriyaki.jpg', 'Phi lê cá hồi Na Uy đút lò giữ trọn độ ẩm, áo sốt Teriyaki đậm đà kèm rau củ thảo mộc.'],
  ['Cá Hồi Đút Lò Sốt Kem Chanh Dây Lá Húng x Khoai Tây Nghiền Vị Wasabi', 'Steak & Main Course', 189000, '/images/menu/ca-hoi-dut-lo-sot-chanh-day.jpg', 'Cá hồi đút lò mềm mịn hòa quyện sốt kem chanh dây lá húng thơm nồng và khoai tây nghiền Wasabi.'],
  // Drink & Dessert (9)
  ['Soda Trái Cây', 'Drink & Dessert', 89000, '/images/menu/soda-trai-cay.jpg', 'Soda tươi mát pha cùng siro trái cây tự nhiên và lá bạc hà sảng khoái.'],
  ['Nước Ngọt Lon - Coca, Sprite, Coca Zero', 'Drink & Dessert', 85000, '/images/menu/nuoc-ngot-lon.jpg', 'Phục vụ ướp lạnh kèm đá viên và lát chanh tươi (tùy chọn Coca, Sprite hoặc Coca Zero).'],
  ['Nước Suối', 'Drink & Dessert', 28000, '/images/menu/nuoc-suoi.jpg', 'Nước khoáng tinh khiết ướp lạnh phục vụ tại bàn.'],
  ['Cocktail Kingchill', 'Drink & Dessert', 75000, '/images/menu/cocktail-kingchill.jpg', 'Cocktail đặc trưng của KingBeef cân bằng giữa vị rượu nền êm dịu và hương trái cây quyến rũ.'],
  ['Mocktail Kingfresh', 'Drink & Dessert', 59000, '/images/menu/mocktail-kingfresh.jpg', 'Thức uống không cồn tươi mát từ cam, chanh dây và thảo mộc.'],
  ['Mocktail Ocean Blue', 'Drink & Dessert', 59000, '/images/menu/mocktail-ocean-blue.jpg', 'Sắc xanh đại dương ấn tượng với hương cam Curacao không cồn và vị chua ngọt dịu nhẹ.'],
  ['Couple Drink: Fresh Love - Set 2 Người', 'Drink & Dessert', 109000, '/images/menu/couple-drink-fresh-love.jpg', 'Bộ đôi thức uống lãng mạn thiết kế riêng cho các cặp đôi tại KingBeef.'],
  ['Kem Trái Cây - 1 Viên', 'Drink & Dessert', 15000, '/images/menu/kem-trai-cay.jpg', 'Kem Gelato mát lạnh vị trái cây tự nhiên, lựa chọn hoàn hảo kết thúc bữa tối.'],
  ['Panna Cotta Trái Tim', 'Drink & Dessert', 28000, '/images/menu/panna-cotta-trai-tim.jpg', 'Panna Cotta mềm mịn tạo hình trái tim ngọt ngào phủ sốt dâu rừng.'],
  // Couple Set (8)
  ['Sweetie Set - Miễn phí trang trí tiệc', 'Couple Set', 479000, '/images/menu/sweetie-set.jpg', 'Set tiệc lãng mạn dành cho 2 người. Đặc biệt: Miễn phí trang trí bàn tiệc nến & hoa.', 0, 'Miễn phí trang trí tiệc'],
  ['Love Set 1', 'Couple Set', 519000, '/images/menu/love-set-1.jpg', 'Set ẩm thực Âu tinh tế cho 2 người kết hợp Salad, Pasta và Steak thượng hạng.'],
  ['Love Set 3', 'Couple Set', 529000, '/images/menu/love-set-3.jpg', 'Trải nghiệm bữa tối lãng mạn cho 2 khách với món khai vị đặc sắc và cặp Steak chuẩn vị.'],
  ['Love Set 2', 'Couple Set', 559000, '/images/menu/love-set-2.jpg', 'Set cao cấp cho 2 người với Soup, Salad, Steak bò Mỹ và món tráng miệng ngọt ngào.'],
  ['King Ocean', 'Couple Set', 635000, '/images/menu/king-ocean.jpg', 'Bữa tiệc đại dương & đất liền (Surf & Turf) cho 2 người kết hợp Hải sản đút lò, Cá hồi và Steak.'],
  ['Kinglove Set 1', 'Couple Set', 639000, '/images/menu/kinglove-set-1.jpg', 'Set tiệc đặc biệt 2 người với bò Kobe, Mì Ý cao cấp, khai vị và Panna Cotta Trái Tim.'],
  ['Kinglove Set 2', 'Couple Set', 639000, '/images/menu/kinglove-set-2.jpg', 'Set hoàng gia cho 2 người kết hợp What The Steak phô mai bắp bỏ lò, Salad Burrata và đồ uống.'],
  ['King & Queen - Gồm Beef Wellington Premium', 'Couple Set', 779000, '/images/menu/king-and-queen-set.jpg', 'Đỉnh cao ẩm thực hẹn hò dành cho 2 người với tâm điểm là Beef Wellington Premium. Yêu cầu đặt trước tối thiểu 4 giờ.', 4, 'Đặt trước tối thiểu 4 giờ'],
];

export function createInitialDemoDB() {
  const branches = [
    {
      id: 1,
      name: 'Tân Bình',
      address: '120 Trương Công Định, Quận Tân Bình, TP.HCM',
      phone: '0562 275 375',
    },
    {
      id: 2,
      name: 'Gò Vấp',
      address: '495 Phan Văn Trị, Quận Gò Vấp, TP.HCM',
      phone: '0562 275 375',
    },
  ];

  const halls = [
    { id: 1, branchId: 1, name: 'Sảnh Classic', type: 'indoor', description: 'Không gian cổ điển châu Âu với ánh đèn trầm ấm sang trọng, phù hợp tiệc gia đình và tiếp khách.' },
    { id: 2, branchId: 1, name: 'Sảnh Gallery', type: 'indoor', description: 'Không gian triển lãm nghệ thuật đương đại rộng rãi với 12 bàn sang trọng.' },
    { id: 3, branchId: 1, name: 'Sảnh Train to Love', type: 'indoor', description: 'Lấy cảm hứng từ chuyến tàu đêm châu Âu đầy lãng mạn dành cho các cặp đôi.' },
    { id: 4, branchId: 2, name: 'Sảnh Sweet', type: 'indoor', description: 'Không gian ngọt ngào, ấm cúng với ánh nến lung linh cho những buổi hẹn hò đáng nhớ.' },
    { id: 5, branchId: 2, name: 'Sảnh Love', type: 'indoor', description: 'Khu vực riêng tư ấm áp với 6 bàn tinh tế đánh số từ 13 đến 18.' },
    { id: 6, branchId: 2, name: 'Sảnh VIP', type: 'vip', description: 'Khu vực phòng và vách ngăn riêng tư đẳng cấp dành cho tiệc doanh nhân và kỷ niệm đặc biệt.' },
    { id: 7, branchId: 2, name: 'Sảnh Mây', type: 'outdoor', description: 'Không gian ngoài trời thoáng đãng dưới bầu trời đêm với đèn dây ấm áp.' },
  ];

  const tables = [
    ...buildGridTables(1, 1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5, 3.2, 3.6, [2, 4, 4, 4, 6]),
    ...buildGridTables(11, 2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4, 3.4, 3.2, [4, 4, 2, 6]),
    ...buildGridTables(23, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2, 5.2, 2.7, [2, 2, 4, 2, 4]),
    ...buildGridTables(33, 4, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11], 5, 3.2, 3.6, [2, 2, 4, 4, 4]),
    ...buildGridTables(43, 5, [13, 14, 15, 16, 17, 18], 3, 3.6, 3.8, [2, 2, 4]),
    ...buildGridTables(49, 6, [1, 2, 3, 4, 5, 6, 7, 8], 4, 4.2, 4.4, [6, 8, 6, 8]),
    ...buildGridTables(57, 7, [1, 2, 3, 4, 5, 6], 3, 4.0, 4.0, [2, 4, 4]),
  ];

  const menuItems = RAW_MENU.map((m, i) => ({
    id: i + 1,
    name: m[0],
    category: m[1],
    price: m[2],
    imageUrl: m[3],
    description: m[4],
    requiresAdvanceOrderHours: m[5] || 0,
    badge: m[6] || null,
    stockQuantity: 50,
    isAvailable: true,
  }));

  const nowIso = new Date().toISOString();
  const users = [
    { id: 1, fullName: 'Quản Trị Viên KingBeef', email: 'admin@kingbeef.vn', phone: '0562 275 375', password: 'Admin@123', role: 'admin', branchId: null, createdAt: nowIso },
    { id: 2, fullName: 'Thu Ngân Minh Thư', email: 'cashier@kingbeef.vn', phone: '0909000002', password: 'Cashier@123', role: 'cashier', branchId: 1, createdAt: nowIso },
    { id: 3, fullName: 'Phục Vụ Hoàng Nam', email: 'staff@kingbeef.vn', phone: '0909000003', password: 'Staff@123', role: 'staff', branchId: 2, createdAt: nowIso },
    { id: 4, fullName: 'Nguyễn Minh Anh', email: 'customer@kingbeef.vn', phone: '0912345678', password: 'Customer@123', role: 'customer', branchId: null, createdAt: nowIso },
    { id: 5, fullName: 'Trần Quốc Bảo', email: 'quocbao@example.com', phone: '0987654321', password: 'Customer@123', role: 'customer', branchId: null, createdAt: nowIso },
  ];

  const reservations = [
    {
      id: 1, bookingCode: 'KB-TB-DEMO01', userId: 4, guestName: 'Nguyễn Minh Anh', guestPhone: '0912345678', guestEmail: 'customer@kingbeef.vn',
      branchId: 1, hallId: 1, tableId: 1, reservationDate: dateOffset(-2), startTime: '18:00', endTime: '20:00', guestCount: 2,
      hasWinePromo: true, totalAmount: 678000, depositAmount: 203400, depositStatus: 'paid', status: 'completed',
      specialRequest: 'Trang trí kỷ niệm 2 năm ngày yêu nhau', createdAt: nowIso,
      items: [{ id: 1, menuItemId: 45, quantity: 1, unitPrice: 479000 }],
    },
    {
      id: 2, bookingCode: 'KB-GV-DEMO02', userId: 5, guestName: 'Trần Quốc Bảo', guestPhone: '0987654321', guestEmail: 'quocbao@example.com',
      branchId: 2, hallId: 6, tableId: 49, reservationDate: dateOffset(-1), startTime: '19:00', endTime: '21:00', guestCount: 4,
      hasWinePromo: true, totalAmount: 1217000, depositAmount: 365100, depositStatus: 'paid', status: 'completed',
      specialRequest: 'Phòng yên tĩnh tiếp đối tác', createdAt: nowIso,
      items: [
        { id: 2, menuItemId: 52, quantity: 1, unitPrice: 779000 },
        { id: 3, menuItemId: 14, quantity: 1, unitPrice: 239000 },
      ],
    },
    {
      id: 3, bookingCode: 'KB-TB-DEMO03', userId: 4, guestName: 'Nguyễn Minh Anh', guestPhone: '0912345678', guestEmail: 'customer@kingbeef.vn',
      branchId: 1, hallId: 3, tableId: 24, reservationDate: dateOffset(0), startTime: '19:00', endTime: '21:00', guestCount: 2,
      hasWinePromo: false, totalAmount: 527000, depositAmount: 200000, depositStatus: 'paid', status: 'confirmed',
      specialRequest: 'Steak chín Medium Rare', createdAt: nowIso,
      items: [
        { id: 4, menuItemId: 27, quantity: 2, unitPrice: 199000 },
        { id: 5, menuItemId: 20, quantity: 1, unitPrice: 129000 },
      ],
    },
    {
      id: 4, bookingCode: 'KB-GV-DEMO04', userId: null, guestName: 'Lê Thanh Trúc (Khách vãng lai)', guestPhone: '0938112233', guestEmail: 'thanhtruc@gmail.com',
      branchId: 2, hallId: 7, tableId: 57, reservationDate: dateOffset(0), startTime: '20:00', endTime: '22:00', guestCount: 2,
      hasWinePromo: true, totalAmount: 678000, depositAmount: 203400, depositStatus: 'waiting_confirm', status: 'waiting_deposit_confirm',
      specialRequest: 'Bàn ngắm trời tối, trang trí sinh nhật nhẹ nhàng', createdAt: nowIso,
      items: [{ id: 6, menuItemId: 45, quantity: 1, unitPrice: 479000 }],
    },
    {
      id: 5, bookingCode: 'KB-GV-DEMO05', userId: 4, guestName: 'Nguyễn Minh Anh', guestPhone: '0912345678', guestEmail: 'customer@kingbeef.vn',
      branchId: 2, hallId: 4, tableId: 35, reservationDate: dateOffset(1), startTime: '18:30', endTime: '20:30', guestCount: 4,
      hasWinePromo: false, totalAmount: 0, depositAmount: 200000, depositStatus: 'paid', status: 'confirmed',
      specialRequest: 'Gọi món trực tiếp tại nhà hàng', createdAt: nowIso,
      items: [],
    },
  ];

  const activityLogs = [
    { id: 1, userId: 2, branchId: 1, action: 'CONFIRM_DEPOSIT', targetType: 'Reservation', targetId: 'KB-TB-DEMO03', details: 'Duyệt đặt cọc QR 200.000đ cho đơn KB-TB-DEMO03 (Sảnh Train to Love - Bàn 2)', createdAt: nowIso },
    { id: 2, userId: 3, branchId: 2, action: 'CHECK_IN', targetType: 'Reservation', targetId: 'KB-GV-DEMO02', details: 'Check-in khách Trần Quốc Bảo tại đơn KB-GV-DEMO02 (Sảnh VIP - Bàn 1)', createdAt: nowIso },
    { id: 3, userId: 2, branchId: 2, action: 'COMPLETE_BOOKING', targetType: 'Reservation', targetId: 'KB-GV-DEMO02', details: 'Hoàn tất thanh toán đơn KB-GV-DEMO02 (Tổng món: 1.217.000đ)', createdAt: nowIso },
    { id: 4, userId: 1, branchId: 1, action: 'UPDATE_TABLE', targetType: 'Table', targetId: '12', details: 'Chuyển Bàn số 12 (Sảnh Gallery - Tân Bình) sang trạng thái bảo trì (maintenance)', createdAt: nowIso },
    { id: 5, userId: 3, branchId: 2, action: 'UPDATE_STOCK', targetType: 'MenuItem', targetId: '27', details: 'Kiểm tra & đồng bộ tồn kho món "Steak Kobe x Khoai Tây Nghiền Vị Wasabi" (50 phần)', createdAt: nowIso },
  ];

  return { branches, halls, tables, menuItems, users, reservations, activityLogs };
}
