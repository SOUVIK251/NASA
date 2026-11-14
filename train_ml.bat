@echo off
echo =======================================================================
echo  NASA Flame in Freefall - Training Physics-Informed ML (PIML) Model
echo =======================================================================
py backend/ml/train_flex_model.py
if errorlevel 1 (
    echo [!] Training failed.
    pause
    exit /b %errorlevel%
)
echo.
echo [+] Model training complete and serialized to backend\ml\models\
pause
