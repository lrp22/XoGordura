import { useForm } from "@tanstack/react-form";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
  useToast,
} from "heroui-native";
import { useRef } from "react";
import { Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Insira um email válido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(8, "Use pelo menos 8 caracteres"),
});

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = getErrorMessage(issue);
      if (message) return message;
    }
    return null;
  }
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === "string") return maybeError.message;
  }
  return null;
}

function SignIn() {
  const passwordInputRef = useRef<TextInput>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signIn.email(
        { email: value.email.trim(), password: value.password },
        {
          onError(error) {
            toast.show({
              variant: "danger",
              label: error.error?.message || "Falha ao entrar",
            });
          },
          onSuccess() {
            formApi.reset();
            toast.show({
              variant: "success",
              label: "Login realizado com sucesso!",
            });
          },
        },
      );
    },
  });

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <Surface
        variant="secondary"
        className="p-6 rounded-3xl bg-card border border-border"
      >
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-foreground text-xl font-bold">
            Bem-vindo de volta
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            Entre na sua conta para continuar
          </Text>
        </View>

        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            validationError: getErrorMessage(state.errorMap.onSubmit),
          })}
        >
          {({ isSubmitting, validationError }) => (
            <>
              {!!validationError && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <FieldError isInvalid className="mb-4">
                    {validationError}
                  </FieldError>
                </Animated.View>
              )}

              <View className="gap-4">
                <form.Field name="email">
                  {(field) => (
                    <TextField>
                      <Label>Email</Label>
                      <Input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="email@exemplo.com"
                        placeholderTextColor="#43423f"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() =>
                          passwordInputRef.current?.focus()
                        }
                      />
                    </TextField>
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <TextField>
                      <Label>Senha</Label>
                      <Input
                        ref={passwordInputRef}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="••••••••"
                        placeholderTextColor="#43423f"
                        secureTextEntry
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="go"
                        onSubmitEditing={form.handleSubmit}
                      />
                    </TextField>
                  )}
                </form.Field>

                <Button
                  size="lg"
                  onPress={form.handleSubmit}
                  isDisabled={isSubmitting}
                  className="mt-2 h-14 bg-primary"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Button.Label className="text-base font-bold text-foreground">
                      Entrar
                    </Button.Label>
                  )}
                </Button>
              </View>
            </>
          )}
        </form.Subscribe>
      </Surface>
    </Animated.View>
  );
}

export { SignIn };
