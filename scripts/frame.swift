// Videodan bitta kadrni JPEG qilib saqlaydi (macOS AVFoundation; ffmpeg kerak emas). https havola ham, fayl ham bo'ladi:
//   swift scripts/frame.swift <video havola yoki fayl> <chiqish.jpg> [soniya=3] [eni=640]
// Video R2'da bo'lsa ham hammasini yuklamaydi: kadr uchun kerakli qismini so'raydi.
import AVFoundation
import Foundation
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count >= 3 else { FileHandle.standardError.write(Data("Ishlatish: frame.swift <video> <chiqish.jpg> [soniya] [eni]\n".utf8)); exit(2) }
let src = a[1].hasPrefix("http") ? URL(string: a[1])! : URL(fileURLWithPath: a[1])
let out = URL(fileURLWithPath: a[2])
let sec = a.count > 3 ? Double(a[3]) ?? 3 : 3
let width = a.count > 4 ? Double(a[4]) ?? 640 : 640

let gen = AVAssetImageGenerator(asset: AVURLAsset(url: src))
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: width, height: width * 2)  // eni bo'yicha kichraytiriladi, nisbat saqlanadi
gen.requestedTimeToleranceBefore = CMTime(seconds: 1, preferredTimescale: 600)
gen.requestedTimeToleranceAfter = CMTime(seconds: 1, preferredTimescale: 600)

do {
    let (cg, _) = try await gen.image(at: CMTime(seconds: sec, preferredTimescale: 600))
    guard let dst = CGImageDestinationCreateWithURL(out as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { exit(1) }
    CGImageDestinationAddImage(dst, cg, [kCGImageDestinationLossyCompressionQuality: 0.78] as CFDictionary)
    guard CGImageDestinationFinalize(dst) else { exit(1) }
    print("OK \(cg.width)x\(cg.height)")
} catch {
    FileHandle.standardError.write(Data("XATO: \(error.localizedDescription)\n".utf8))
    exit(1)
}
