import Link from "next/link";

import { revokeAllSessionsAction } from "../session-actions";
import styles from "./vandaag.module.css";

export default function VandaagPage() {
  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="vandaag-title">
        <p className={styles.eyebrow}>Vandaag</p>
        <h1 id="vandaag-title">Planning nog niet berekend</h1>
        <p>
          De beveiligde projectbasis is actief. De echte dagplanning volgt in fase 3;
          er wordt nu geen taakvolgorde of beschikbare werktijd verzonnen.
        </p>
        <Link className={styles.primaryLink} href="/taken">
          ToDo bekijken
        </Link>
      </section>

      <section className={styles.status} aria-labelledby="status-title">
        <div>
          <p className={styles.eyebrow}>Technische status</p>
          <h2 id="status-title">Veilige toegang gereed</h2>
        </div>
        <dl>
          <div>
            <dt>Planning vernieuwd</dt>
            <dd>Nog niet beschikbaar</dd>
          </div>
          <div>
            <dt>Deadline-alarmen</dt>
            <dd>Volgen in fase 4</dd>
          </div>
          <div>
            <dt>Actief werk</dt>
            <dd>Volgt in fase 2</dd>
          </div>
        </dl>
      </section>

      <section className={styles.security} aria-labelledby="security-title">
        <div>
          <h2 id="security-title">Sessiebeveiliging</h2>
          <p>
            Gebruik deze actie wanneer je alle open MijnPlanning-sessies direct wilt
            intrekken. Je moet daarna opnieuw inloggen.
          </p>
        </div>
        <form action={revokeAllSessionsAction}>
          <button type="submit">Alle sessies intrekken</button>
        </form>
      </section>
    </main>
  );
}
