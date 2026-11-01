# Capacitor discovers plugins by JSON class name and runtime annotations.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * extends com.getcapacitor.Plugin { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
# Deliver mapping.txt with each release for deobfuscated crash reports.
-keepattributes SourceFile,LineNumberTable
