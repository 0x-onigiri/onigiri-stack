"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { truncateAddress } from '@/lib/utils'
import {
  useCurrentAccount,
  useAccounts,
  useDisconnectWallet,
  ConnectModal,
  useSwitchAccount,
} from '@mysten/dapp-kit'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { WalletAccount } from '@mysten/wallet-standard'
import { cn } from '@/lib/utils'

export function Header() {
  const [open, setOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  const accounts = useAccounts()

  return (
    <header className="w-full py-2 px-6 flex justify-between items-center border-b">
      <Link href="/" className="text-2xl font-bold text-primary">
        Onigiri Stack
      </Link>

      <div className="flex justify-between items-center gap-4">

        {!currentAccount && (
          <ConnectModal
            trigger={(
              <Button>
                Connect Wallet
              </Button>
            )}
            open={open}
            onOpenChange={isOpen => setOpen(isOpen)}
          />
        )}

        {currentAccount && (
          <WalletMenu
            walletAccount={currentAccount}
            wallets={accounts}
          />
        )}
      </div>
    </header>
  )
}

function WalletMenu({
  walletAccount,
  wallets,
}: {
  walletAccount: WalletAccount
  wallets: readonly WalletAccount[]
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <WalletButton
        walletAccount={walletAccount}
        wallets={wallets}
      />
    </div>
  )
}

function WalletButton({
  walletAccount,
  wallets,
}: {
  walletAccount: WalletAccount
  wallets: readonly WalletAccount[]
}) {
  const { mutate: disconnect } = useDisconnectWallet()
  const { mutate: switchAccount } = useSwitchAccount()

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button>
            {truncateAddress(walletAccount.address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="flex flex-col gap-3 p-3">
            {/* {walletAccount?.label && <p>{walletAccount.label}</p>} */}
            <p>{truncateAddress(walletAccount.address)}</p>
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          {
            wallets.map((account) => {
              const isCurrentAccount = account.address === walletAccount.address
              return (
                <DropdownMenuItem key={account.address}>
                  <Button
                    className={
                      cn(
                        isCurrentAccount && 'bg-accent',
                      )
                    }
                    variant="secondary"
                    onClick={() => {
                      switchAccount(
                        { account },
                        {
                          onSuccess: () => console.log(`switched to ${account.address}`),
                        },
                      )
                    }}
                  >
                    {
                      truncateAddress(account.address)
                    }
                  </Button>
                </DropdownMenuItem>
              )
            })
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
