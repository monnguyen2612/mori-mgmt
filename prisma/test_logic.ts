import { prisma } from "@/lib/prisma";
import { createCustomer } from "@/app/dashboard/customers/actions";
import { checkInCustomer } from "@/app/dashboard/checkin/actions";

async function runTests() {
  console.log("=== BẮT ĐẦU CHẠY BẢN KIỂM THỬ HỆ THỐNG ===");

  // Test Case 1: Tạo khách hàng mới với các trường ngày bỏ trống (chuỗi rỗng)
  console.log("\n--- TEST CASE 1: Thêm khách hàng mới với trường ngày bỏ trống ---");
  const testCustomerData = {
    code: "KHTEST10",
    name: "Khách Hàng Test 10",
    phone: "0999000123",
    dob: "", // Trống
    currentPackage: "Gói VIP 30 buổi",
    totalSessions: "15",
    usedSessions: "0",
    purchaseDate: "2026-06-01",
    activationDate: "", // Trống
    expirationDate: "", // Trống
    status: "ACTIVE",
    notes: "Kiểm thử nhập ngày trống.",
    paymentAmount: "0",
    paymentMethod: "BANK_TRANSFER",
    salesperson: "Tester",
  };

  try {
    // Delete test customer if already exists
    await prisma.customer.deleteMany({ where: { code: "KHTEST10" } });
    
    console.log("Đang gọi action createCustomer...");
    const res = await createCustomer(testCustomerData);
    console.log("Kết quả tạo khách hàng:", res);

    if (res.success) {
      console.log("-> TEST CASE 1 THÀNH CÔNG: Đã thêm khách hàng thành công mà không bị crash date parser!");
    } else {
      console.error("-> TEST CASE 1 THẤT BẠI:", res.error);
    }
  } catch (err) {
    console.error("-> TEST CASE 1 THẤT BẠI DO LỖI NGOẠI LỆ:", err);
  }

  // Test Case 2: Check-in cho học viên không có hoá đơn trực tiếp và tính Commission HLV
  console.log("\n--- TEST CASE 2: Điểm danh và tính toán đơn giá buổi tập tự phục hồi ---");
  try {
    // Fetch newly created customer
    const customer = await prisma.customer.findUnique({
      where: { code: "KHTEST10" },
    });

    if (!customer) {
      throw new Error("Không tìm thấy khách hàng test vừa tạo.");
    }

    // Delete past logs for this test customer to isolate test
    await prisma.attendanceLog.deleteMany({ where: { customerId: customer.id } });

    // Fetch customer package ID
    const pkg = await prisma.customerPackage.findFirst({
      where: { customerId: customer.id },
    });
    if (!pkg) {
      throw new Error("Không tìm thấy gói tập được tạo cho khách hàng test.");
    }

    console.log("Đang thực hiện check-in cho khách hàng không có hóa đơn trực tiếp...");
    const checkinRes = await checkInCustomer(customer.id, pkg.id, "HLV Chloe", "Test checkin tự phục hồi giá trị");
    console.log("Kết quả check-in:", checkinRes);

    if (checkinRes.success) {
      // Fetch the created log
      const createdLog = await prisma.attendanceLog.findFirst({
        where: { customerId: customer.id },
        orderBy: { date: "desc" },
      });

      console.log("Bản ghi điểm danh được tạo:", {
        id: createdLog?.id,
        packageName: createdLog?.packageName,
        trainer: createdLog?.trainer,
        costPerSession: createdLog?.costPerSession,
      });

      if (createdLog && createdLog.costPerSession > 0) {
        console.log(`-> TEST CASE 2 THÀNH CÔNG: Đơn giá buổi tập đã được tự động ước lượng là ${createdLog.costPerSession.toLocaleString("vi-VN")} ₫ (dựa trên gói hoặc mặc định), hoa hồng HLV sẽ khả dụng.`);
      } else {
        console.error("-> TEST CASE 2 THẤT BẠI: Đơn giá buổi tập bị ghi nhận là 0 ₫.");
      }
    } else {
      console.error("-> TEST CASE 2 THẤT BẠI:", checkinRes.error);
    }

    // Clean up test customer data
    await prisma.attendanceLog.deleteMany({ where: { customerId: customer.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log("\nĐã dọn dẹp dữ liệu kiểm thử thành công.");
  } catch (err) {
    console.error("-> TEST CASE 2 THẤT BẠI DO LỖI NGOẠI LỆ:", err);
  }

  console.log("\n=== HOÀN THÀNH CHẠY BẢN KIỂM THỬ ===");
  await prisma.$disconnect();
}

runTests();
