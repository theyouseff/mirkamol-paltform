package ilmaviya.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Darslarni ekrandan yozib olish va skrinshot qilishni taqiqlash: yozuvda va "So'nggi ilovalar" ro'yxatida ekran qora bo'ladi
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }
}
