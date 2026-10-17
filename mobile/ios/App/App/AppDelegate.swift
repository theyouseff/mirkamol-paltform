import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // Ekran yozib olinayotganda (yoki AirPlay/kabel orqali boshqa ekranga uzatilganda) ilova ustini qora parda bilan yopamiz:
    // darslarni yozib olib tarqatib bo'lmasin. iOS skrinshotni taqiqlashga ruxsat bermaydi, yozuvni esa shu tarzda to'samiz.
    private var captureCover: UIView?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NotificationCenter.default.addObserver(self, selector: #selector(updateCaptureCover), name: UIScreen.capturedDidChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(updateCaptureCover), name: UIScene.didActivateNotification, object: nil)
        return true
    }

    @objc private func updateCaptureCover() {
        DispatchQueue.main.async {
            let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }
            guard let window = windows.first(where: { $0.isKeyWindow }) ?? windows.first else { return }
            let captured = window.windowScene?.screen.isCaptured ?? false
            if captured {
                if self.captureCover == nil {
                    let cover = UIView(frame: window.bounds)
                    cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                    cover.backgroundColor = UIColor(red: 0.08, green: 0.10, blue: 0.13, alpha: 1)
                    let label = UILabel()
                    label.text = "Ekran yozib olinmoqda.\nDarslarni yozib olish taqiqlangan."
                    label.numberOfLines = 0
                    label.textAlignment = .center
                    label.textColor = UIColor(red: 0.90, green: 0.76, blue: 0.48, alpha: 1)
                    label.font = .systemFont(ofSize: 17, weight: .semibold)
                    label.translatesAutoresizingMaskIntoConstraints = false
                    cover.addSubview(label)
                    NSLayoutConstraint.activate([
                        label.centerXAnchor.constraint(equalTo: cover.centerXAnchor),
                        label.centerYAnchor.constraint(equalTo: cover.centerYAnchor),
                        label.leadingAnchor.constraint(greaterThanOrEqualTo: cover.leadingAnchor, constant: 24),
                    ])
                    self.captureCover = cover
                }
                if let cover = self.captureCover, cover.superview !== window {
                    cover.removeFromSuperview()
                    cover.frame = window.bounds
                    window.addSubview(cover)
                }
                if let cover = self.captureCover { window.bringSubviewToFront(cover) }
            } else {
                self.captureCover?.removeFromSuperview()
                self.captureCover = nil
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
