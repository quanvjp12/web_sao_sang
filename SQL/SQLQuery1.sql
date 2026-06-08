CREATE DATABASE TrungTam;
GO
USE TrungTam;

CREATE TABLE HocVien (
    MaHV INT IDENTITY(1,1) PRIMARY KEY,
    TenHV NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    DiaChi NVARCHAR(255),
    DienThoai NVARCHAR(15),
    Email NVARCHAR(100),
    NgayNhapHoc DATE DEFAULT GETDATE(),
    TrangThai NVARCHAR(50) DEFAULT N'Đang học'
);

CREATE TABLE GiaoVien (
    MaGV INT IDENTITY(1,1) PRIMARY KEY,
    TenGV NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    DienThoai NVARCHAR(15),
    Email NVARCHAR(100),
    ChuyenMon NVARCHAR(100),
    Luong DECIMAL(10,2),
    TrangThai NVARCHAR(50) DEFAULT N'Đang dạy'
);

CREATE TABLE LopHoc (
    MaLop INT IDENTITY(1,1) PRIMARY KEY,
    TenLop NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255),
    HocPhi DECIMAL(10,2),
    SoLuongToiDa INT,
    NgayBatDau DATE,
    NgayKetThuc DATE,
    LichHoc NVARCHAR(100),
    MaGV INT,
    FOREIGN KEY (MaGV) REFERENCES GiaoVien(MaGV)
);

CREATE TABLE DangKy (
    MaDK INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
    NgayDangKy DATE DEFAULT GETDATE(),
    TrangThai NVARCHAR(50) DEFAULT N'Đang học',
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE Diem (
    MaDiem INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
	DiemThuongXuyen1 FLOAT,
	DiemThuongXuyen2 FLOAT,
    DiemGiuaKy FLOAT,
    DiemCuoiKy FLOAT,
    DiemTongKet AS (
        (ISNULL(DiemThuongXuyen1,0) + ISNULL(DiemThuongXuyen2,0) +
         ISNULL(DiemGiuaKy,0)*2 + ISNULL(DiemCuoiKy,0)*3) / 7),
    NhanXet NVARCHAR(255),
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE HocPhi (
    MaHP INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
    SoTien DECIMAL(10,2),
    NgayDong DATE,
    TrangThai NVARCHAR(50) DEFAULT N'Chưa đóng',
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE TaiKhoan(
    Username VARCHAR(50) PRIMARY KEY,
    Password VARCHAR(50) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('admin', 'giaovien', 'hocvien')),
    MaGV INT NULL,
    MaHV INT NULL
);

CREATE TABLE LichHoc(
    MaLich INT PRIMARY KEY IDENTITY(1,1),
    MaLop INT NOT NULL,
    ThuHoc NVARCHAR(20) NOT NULL,
    GioBatDau TIME NOT NULL,
    GioKetThuc TIME NOT NULL,
    FOREIGN KEY (MaLop)
    REFERENCES LopHoc(MaLop)
);

INSERT INTO GiaoVien (TenGV, GioiTinh, DienThoai, Email, ChuyenMon, Luong)
VALUES 
(N'Nguyễn Văn Phú', N'Nam', '0901234567', 'phu123@gmail.com', N'Toán', 10000000),
(N'Trần Thị Minh', N'Nữ', '0902445989', 'abcminh@gmail.com', N'Văn', 9000000),
(N'Lê Văn Long', N'Nam', '0903362690', 'along2204@gmail.com', N'Anh', 9500000),
(N'Phạm Văn Tiến', N'Nam', '0904097093', 'tienpham2020@gmail.com', N'Lý', 9200000),
(N'Hoàng Văn Phong', N'Nam', '0905225236', 'phongabc@gmail.com', N'Hóa', 9700000);

INSERT INTO LopHoc (TenLop, HocPhi, MaGV)
VALUES
(N'Lớp Toán 1', 1000000, 1),
(N'Lớp Văn 1', 900000, 2),
(N'Lớp Anh 1', 950000, 3),
(N'Lớp Lý 1', 920000, 4),
(N'Lớp Hóa 1', 970000, 5),
(N'Lớp Sinh 1', 880000, 5),
(N'Lớp Toán 2', 1000000, 1),
(N'Lớp Văn 2', 900000, 2),
(N'Lớp Anh 2', 950000, 3),
(N'Lớp Lý 2', 920000, 4);

INSERT INTO HocVien (TenHV, GioiTinh, DienThoai, Email)
VALUES
(N'Mai Xuân An', N'Nam', '0911023023', ''),
(N'Trịnh Đức Anh', N'Nam', '0912225669', ''),
(N'Phạm Kim Cương', N'Nam', '0913667567', ''),
(N'Lê Ngọc Hảo', N'Nam', '0914567992', ''),
(N'Nguyễn Việt Hoàng', N'Nam', '0915225258', ''),
(N'Lê Thị Kim Anh', N'Nữ', '0916235357', ''),
(N'Lê Ánh Huyền', N'Nữ', '0917769269', ''),
(N'Bùi Thị Cẩm Ly', N'Nữ', '0918518181', ''),
(N'Nguyễn Thị Mỹ Hạnh', N'Nữ', '0919023634', ''),
(N'Trần Thu Hà', N'Nữ', '0920097533', '');

INSERT INTO DangKy (MaHV, MaLop)
VALUES
(1,1),(2,1),(3,2),(4,2),(5,3),
(6,4),(7,5),(8,6),(9,7),(10,8);

INSERT INTO HocPhi (MaHV, MaLop, SoTien, TrangThai)
VALUES
(1,1,1000000,N'Đã đóng'),
(2,1,1000000,N'Chưa đóng'),
(3,2,900000,N'Đã đóng'),
(4,2,900000,N'Chưa đóng'),
(5,3,950000,N'Đã đóng'),
(6,4,920000,N'Đã đóng'),
(7,5,970000,N'Chưa đóng'),
(8,6,880000,N'Đã đóng'),
(9,7,1000000,N'Chưa đóng'),
(10,8,900000,N'Đã đóng');

INSERT INTO Diem (MaHV, MaLop, DiemThuongXuyen1, DiemThuongXuyen2, DiemGiuaKy, DiemCuoiKy)
VALUES
(1,1,8,7,8,9),
(2,1,7,6,7,8),
(3,2,6,7,6,7),
(4,2,9,8,9,9),
(5,3,8,8,8,8),
(6,4,7,7,7,7),
(7,5,6,6,6,6),
(8,6,9,9,9,10),
(9,7,8,7,8,9),
(10,8,7,8,7,8);

INSERT INTO TaiKhoan
VALUES
( 'admin', '123', 'admin', NULL, NULL),
( 'nguyenvanphu', '123', 'giaovien', 1, NULL),
( 'tranthiminh', '123', 'giaovien', 2, NULL),
( 'levanlong', '123', 'giaovien', 3, NULL),
( 'phamvantien', '123', 'giaovien', 4, NULL),
( 'hoangvanphong', '123', 'giaovien', 5, NULL),
( 'duongducduy', '123', 'giaovien', 6, NULL),
( 'hocvien1', '123', 'hocvien', NULL, 1),
( 'hocvien2', '123', 'hocvien', NULL, 2),
( 'hocvien3', '123', 'hocvien', NULL, 3),
( 'hocvien4', '123', 'hocvien', NULL, 4),
( 'hocvien5', '123', 'hocvien', NULL, 5),
( 'hocvien6', '123', 'hocvien', NULL, 6),
( 'hocvien7', '123', 'hocvien', NULL, 7),
( 'hocvien8', '123', 'hocvien', NULL, 8),
( 'hocvien9', '123', 'hocvien', NULL, 9),
( 'hocvien10', '123', 'hocvien', NULL, 10)

INSERT INTO LichHoc(MaLop, ThuHoc, GioBatDau, GioKetThuc)
VALUES
(1, N'Thứ 2', '18:00', '20:00'),
(1, N'Thứ 4', '18:00', '20:00'),
(2, N'Thứ 3', '13:00', '15:00'),
(3, N'Thứ 2', '13:00', '15:00'),
(3, N'Thứ 4', '8:00', '10:00'),
(4, N'Thứ 5', '13:00', '15:00'),
(5, N'Thứ 6', '8:00', '10:00'),
(6, N'Thứ 6', '13:00', '15:00'),
(6, N'Thứ 7', '13:00', '15:00');